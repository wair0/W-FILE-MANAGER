package com.wfilemanager.app

import android.content.Context
import android.os.Environment
import android.os.StatFs
import android.util.Base64
import android.webkit.MimeTypeMap
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.IOException
import java.util.zip.ZipEntry
import java.util.zip.ZipFile
import java.util.zip.ZipOutputStream

/** Operaciones de archivos. Todas devuelven JSON para el puente WebView. */
object FileOps {

    private val IMG = setOf("jpg", "jpeg", "png", "gif", "webp", "bmp", "heic", "heif", "avif", "svg")
    private val VID = setOf("mp4", "mkv", "avi", "mov", "webm", "3gp", "flv", "wmv", "m4v")
    private val AUD = setOf("mp3", "wav", "flac", "aac", "ogg", "m4a", "opus", "wma", "amr")
    private val DOC = setOf("pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "rtf", "epub")
    private val ZIP = setOf("zip", "jar", "apks", "xapk")
    private val TXT = setOf(
        "txt", "log", "md", "json", "xml", "csv", "ini", "conf", "cfg", "properties", "yml", "yaml",
        "html", "htm", "css", "js", "ts", "kt", "java", "py", "sh", "sql", "gradle", "bat", "smali"
    )

    private const val MAX_TEXT = 4L * 1024 * 1024

    fun ext(name: String): String = name.substringAfterLast('.', "").lowercase()

    fun mime(name: String): String =
        MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext(name)) ?: "application/octet-stream"

    private fun File.toJson(): JSONObject = JSONObject().apply {
        put("name", name)
        put("path", absolutePath)
        put("dir", isDirectory)
        put("size", if (isDirectory) 0L else length())
        put("mtime", lastModified())
        put("count", if (isDirectory) (list()?.size ?: 0) else 0)
    }

    // ---------- Almacenamiento ----------

    fun roots(ctx: Context): JSONArray {
        val arr = JSONArray()
        val primary = Environment.getExternalStorageDirectory()
        arr.put(rootJson("Almacenamiento interno", primary, true))
        ctx.getExternalFilesDirs(null).forEach { f ->
            val p = f?.absolutePath?.substringBefore("/Android/data") ?: return@forEach
            if (p != primary.absolutePath && File(p).exists()) {
                arr.put(rootJson("Tarjeta SD", File(p), false))
            }
        }
        return arr
    }

    private fun rootJson(name: String, f: File, primary: Boolean): JSONObject {
        val st = try { StatFs(f.absolutePath) } catch (e: Exception) { null }
        return JSONObject().apply {
            put("name", name)
            put("path", f.absolutePath)
            put("primary", primary)
            put("total", st?.totalBytes ?: 0L)
            put("free", st?.availableBytes ?: 0L)
        }
    }

    // ---------- Listado ----------

    fun list(a: JSONObject): JSONObject {
        val dir = File(a.getString("path"))
        val hidden = a.optBoolean("hidden", false)
        val sort = a.optString("sort", "name")
        val asc = a.optBoolean("asc", true)
        val files = dir.listFiles() ?: throw IOException("No se puede leer la carpeta")
        val cmp: Comparator<File> = when (sort) {
            "size" -> compareBy { it.length() }
            "date" -> compareBy { it.lastModified() }
            "type" -> compareBy<File> { ext(it.name) }.thenBy { it.name.lowercase() }
            else -> compareBy { it.name.lowercase() }
        }
        val ordered = if (asc) cmp else cmp.reversed()
        val visible = files.filter { hidden || !it.name.startsWith(".") }
        val sorted = visible.filter { it.isDirectory }.sortedWith(ordered) +
            visible.filter { !it.isDirectory }.sortedWith(ordered)
        val items = JSONArray()
        sorted.forEach { items.put(it.toJson()) }
        return JSONObject().put("path", dir.absolutePath).put("parent", dir.parent ?: "").put("items", items)
    }

    fun search(a: JSONObject): JSONArray {
        val root = File(a.getString("path"))
        val q = a.getString("q").lowercase()
        val limit = a.optInt("limit", 500)
        val out = JSONArray()
        var n = 0
        for (f in root.walkTopDown().onEnter { !it.name.startsWith(".") || it == root }) {
            if (f != root && f.name.lowercase().contains(q)) {
                out.put(f.toJson()); n++
                if (n >= limit) break
            }
        }
        return out
    }

    fun category(a: JSONObject): JSONArray {
        val type = a.getString("type")
        val limit = a.optInt("limit", 3000)
        val set = when (type) {
            "image" -> IMG
            "video" -> VID
            "audio" -> AUD
            "doc" -> DOC
            "zip" -> ZIP
            "text" -> TXT
            "apk" -> setOf("apk")
            else -> emptySet()
        }
        val root = Environment.getExternalStorageDirectory()
        val found = ArrayList<File>()
        for (f in root.walkTopDown().onEnter { it == root || (!it.name.startsWith(".") && it.name != "Android") }) {
            if (f.isFile && ext(f.name) in set) {
                found.add(f)
                if (found.size >= limit) break
            }
        }
        found.sortByDescending { it.lastModified() }
        val arr = JSONArray()
        found.forEach { arr.put(it.toJson()) }
        return arr
    }

    // ---------- Propiedades ----------

    fun stat(path: String): JSONObject {
        val f = File(path)
        var files = 0L
        var folders = 0L
        var size = 0L
        if (f.isDirectory) {
            f.walkTopDown().forEach {
                if (it == f) return@forEach
                if (it.isDirectory) folders++ else { files++; size += it.length() }
            }
        } else size = f.length()
        return JSONObject().apply {
            put("name", f.name); put("path", f.absolutePath); put("dir", f.isDirectory)
            put("size", size); put("files", files); put("folders", folders)
            put("mtime", f.lastModified()); put("readable", f.canRead()); put("writable", f.canWrite())
            put("hidden", f.name.startsWith(".")); put("mime", if (f.isDirectory) "carpeta" else mime(f.name))
        }
    }

    // ---------- Crear / renombrar / borrar ----------

    private fun uniqueDest(dir: File, name: String): File {
        var f = File(dir, name)
        if (!f.exists()) return f
        val base = name.substringBeforeLast('.', name)
        val ex = if (name.contains('.')) "." + name.substringAfterLast('.') else ""
        var i = 1
        while (f.exists()) { f = File(dir, "$base ($i)$ex"); i++ }
        return f
    }

    private fun safeName(n: String): String {
        val t = n.trim()
        if (t.isEmpty() || t.contains('/') || t == "." || t == "..") throw IOException("Nombre no válido")
        return t
    }

    fun mkdir(parent: String, name: String): String {
        val f = File(parent, safeName(name))
        if (f.exists()) throw IOException("Ya existe")
        if (!f.mkdirs()) throw IOException("No se pudo crear la carpeta")
        return f.absolutePath
    }

    fun newFile(parent: String, name: String, content: String): String {
        val f = File(parent, safeName(name))
        if (f.exists()) throw IOException("Ya existe")
        f.writeText(content)
        return f.absolutePath
    }

    fun rename(path: String, name: String): String {
        val src = File(path)
        val dst = File(src.parentFile, safeName(name))
        if (dst.exists()) throw IOException("Ya existe un elemento con ese nombre")
        if (!src.renameTo(dst)) throw IOException("No se pudo renombrar")
        return dst.absolutePath
    }

    fun delete(paths: JSONArray): Int {
        var n = 0
        for (i in 0 until paths.length()) {
            val f = File(paths.getString(i))
            if (f.deleteRecursively()) n++
        }
        return n
    }

    private fun isInside(child: File, parent: File): Boolean {
        val c = child.canonicalPath
        val p = parent.canonicalPath
        return c == p || c.startsWith(p + File.separator)
    }

    fun copy(paths: JSONArray, dest: String, move: Boolean): Int {
        val d = File(dest)
        if (!d.isDirectory) throw IOException("Destino no válido")
        var n = 0
        for (i in 0 until paths.length()) {
            val src = File(paths.getString(i))
            if (src.isDirectory && isInside(d, src)) throw IOException("No se puede copiar una carpeta dentro de sí misma")
            if (move && src.parentFile?.canonicalPath == d.canonicalPath) continue
            val target = uniqueDest(d, src.name)
            if (move) {
                if (!src.renameTo(target)) {
                    src.copyRecursively(target, false)
                    src.deleteRecursively()
                }
            } else {
                src.copyRecursively(target, false)
            }
            n++
        }
        return n
    }

    // ---------- Texto ----------

    fun readText(path: String): JSONObject {
        val f = File(path)
        if (!f.isFile) throw IOException("No es un archivo")
        if (f.length() > MAX_TEXT) throw IOException("Archivo demasiado grande para editar (máx. 4 MB)")
        return JSONObject().put("text", f.readText()).put("size", f.length())
    }

    fun writeText(path: String, text: String) {
        val f = File(path)
        f.parentFile?.mkdirs()
        f.writeText(text)
    }

    // ---------- ZIP ----------

    fun zipList(path: String): JSONObject {
        val arr = JSONArray()
        var total = 0L
        ZipFile(path).use { z ->
            val en = z.entries()
            while (en.hasMoreElements()) {
                val e = en.nextElement()
                total += maxOf(e.size, 0L)
                arr.put(JSONObject().apply {
                    put("name", e.name)
                    put("dir", e.isDirectory)
                    put("size", e.size)
                    put("csize", e.compressedSize)
                    put("mtime", e.time)
                })
            }
        }
        return JSONObject().put("entries", arr).put("total", total).put("size", File(path).length())
    }

    fun zipRead(path: String, entry: String): JSONObject {
        ZipFile(path).use { z ->
            val e = z.getEntry(entry) ?: throw IOException("Entrada no encontrada")
            val isImg = ext(entry) in IMG
            val limit = if (isImg) 12L * 1024 * 1024 else 1L * 1024 * 1024
            if (e.size > limit) throw IOException("Entrada demasiado grande para previsualizar")
            // No confiar en e.size: algunas entradas ZIP declaran tamaño desconocido.
            // Leer con límite también evita consumir memoria sin control con ZIPs maliciosos.
            val bytes = z.getInputStream(e).use { input ->
                val out = ByteArrayOutputStream()
                val buffer = ByteArray(8192)
                var total = 0L
                while (true) {
                    val count = input.read(buffer)
                    if (count < 0) break
                    total += count
                    if (total > limit) throw IOException("Entrada demasiado grande para previsualizar")
                    out.write(buffer, 0, count)
                }
                out.toByteArray()
            }
            return if (isImg) {
                JSONObject().put("b64", Base64.encodeToString(bytes, Base64.NO_WRAP)).put("mime", mime(entry))
            } else {
                JSONObject().put("text", String(bytes, Charsets.UTF_8))
            }
        }
    }

    fun zipExtract(path: String, dest: String, only: JSONArray?): Int {
        val out = File(dest)
        if (!out.isDirectory && !out.mkdirs()) throw IOException("No se pudo crear la carpeta de destino")
        val base = out.canonicalPath
        var n = 0
        val filter = ArrayList<String>()
        if (only != null) for (i in 0 until only.length()) filter.add(only.getString(i))
        ZipFile(path).use { z ->
            val en = z.entries()
            while (en.hasMoreElements()) {
                val e: ZipEntry = en.nextElement()
                if (filter.isNotEmpty() && filter.none { f -> e.name == f || (f.endsWith("/") && e.name.startsWith(f)) }) continue
                val target = File(out, e.name)
                val canonical = target.canonicalPath
                if (!canonical.startsWith(base + File.separator) && canonical != base) {
                    throw IOException("Entrada ZIP insegura: ${e.name}")
                }
                if (e.isDirectory) {
                    if (target.exists() && !target.isDirectory) {
                        throw IOException("Ya existe un archivo con el nombre de la carpeta: ${e.name}")
                    }
                    if (!target.isDirectory && !target.mkdirs()) {
                        throw IOException("No se pudo crear la carpeta: ${e.name}")
                    }
                } else {
                    // Nunca sobrescribir silenciosamente archivos que ya existen en el destino.
                    if (target.exists()) throw IOException("Ya existe un elemento en el destino: ${e.name}")
                    target.parentFile?.let { parent ->
                        if (!parent.isDirectory && !parent.mkdirs()) {
                            throw IOException("No se pudo crear la carpeta de destino")
                        }
                    }
                    z.getInputStream(e).use { ins -> target.outputStream().use { ins.copyTo(it) } }
                    if (e.time > 0) target.setLastModified(e.time)
                    n++
                }
            }
        }
        return n
    }

    fun zipCreate(paths: JSONArray, destDir: String, name: String): String {
        val n = if (name.lowercase().endsWith(".zip")) name else "$name.zip"
        val out = uniqueDest(File(destDir), safeName(n))
        ZipOutputStream(out.outputStream().buffered()).use { zos ->
            for (i in 0 until paths.length()) {
                val src = File(paths.getString(i))
                val parent = src.parentFile ?: continue
                src.walkTopDown().forEach { f ->
                    if (f.canonicalPath == out.canonicalPath) return@forEach
                    val rel = f.relativeTo(parent).path.replace(File.separatorChar, '/')
                    if (f.isDirectory) {
                        zos.putNextEntry(ZipEntry("$rel/"))
                        zos.closeEntry()
                    } else {
                        val ze = ZipEntry(rel)
                        ze.time = f.lastModified()
                        zos.putNextEntry(ze)
                        f.inputStream().use { it.copyTo(zos) }
                        zos.closeEntry()
                    }
                }
            }
        }
        return out.absolutePath
    }
}
