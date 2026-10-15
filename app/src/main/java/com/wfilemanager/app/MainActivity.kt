package com.wfilemanager.app

import android.Manifest
import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.pdf.PdfRenderer
import android.media.MediaMetadataRetriever
import android.media.MediaController
import android.widget.FrameLayout
import android.widget.VideoView
import android.widget.Toast
import android.os.ParcelFileDescriptor
import android.util.Base64
import java.io.ByteArrayOutputStream
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.Settings
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileInputStream
import java.util.concurrent.Executors

class MainActivity : AppCompatActivity() {

    private lateinit var web: WebView
    private val pool = Executors.newFixedThreadPool(4)
    private val mediaNotificationId = 4107
    private val mediaChannelId = "wfm_audio_playback"
    private val filesRoleName = "android.app.role.FILES"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        web = WebView(this).apply {
            setBackgroundColor(Color.parseColor("#040812"))
            overScrollMode = WebView.OVER_SCROLL_NEVER
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                allowFileAccess = true
                allowContentAccess = false
                cacheMode = WebSettings.LOAD_NO_CACHE
                mediaPlaybackRequiresUserGesture = true
                setSupportZoom(false)
                builtInZoomControls = false
            }
            webChromeClient = WebChromeClient()
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                    val u = request.url
                    if (u.host == "wfile.local") return serveFile(u, request.requestHeaders)
                    // La interfaz es offline: impedir que scripts, estilos o imágenes carguen recursos de red.
                    if (u.scheme == "http" || u.scheme == "https") {
                        return WebResourceResponse(
                            "text/plain",
                            "UTF-8",
                            403,
                            "Blocked by offline policy",
                            mapOf("Cache-Control" to "no-store"),
                            java.io.ByteArrayInputStream(ByteArray(0))
                        )
                    }
                    return null
                }

                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    // La app es 100% offline: no se navega fuera de los assets.
                    return !request.url.toString().startsWith("file:///android_asset/")
                }
            }
            addJavascriptInterface(Bridge(), "WBridge")
        }
        if (applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0) {
            WebView.setWebContentsDebuggingEnabled(true)
        }
        setContentView(web)
        createMediaNotificationChannel()
        web.loadUrl("file:///android_asset/www/index.html")

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                web.evaluateJavascript("window.WFM ? WFM.back() : false") { r ->
                    if (r != "true") finish()
                }
            }
        })
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        intent.getStringExtra("wfm_media_command")?.let { command ->
            web.postDelayed({ web.evaluateJavascript("window.WFM && WFM.mediaCommand && WFM.mediaCommand(" + JSONObject.quote(command) + ")", null) }, 250)
        }
    }

    override fun onResume() {
        super.onResume()
        if (::web.isInitialized) web.evaluateJavascript("window.WFM && WFM.onResume && WFM.onResume()", null)
    }

    override fun onDestroy() {
        pool.shutdownNow()
        super.onDestroy()
    }

    // ---------- Servir archivos locales a la WebView (miniaturas / visor) ----------

    private fun serveFile(u: Uri, requestHeaders: Map<String, String>): WebResourceResponse? {
        val p = u.getQueryParameter("p") ?: return null
        val f = File(p)
        if (!f.isFile || !f.canRead()) return null

        // Chromium solicita bytes parciales para reproducir y buscar dentro de audio/vídeo.
        // Sin soporte Range, algunos contenedores no llegan a iniciar o no permiten avanzar.
        val range = requestHeaders.entries.firstOrNull { it.key.equals("Range", ignoreCase = true) }?.value
        val length = f.length()
        var start = 0L
        var end = (length - 1).coerceAtLeast(0L)
        var partial = false
        if (!range.isNullOrBlank() && range.startsWith("bytes=") && length > 0L) {
            val parts = range.removePrefix("bytes=").substringBefore(',').split('-', limit = 2)
            val requestedStart = parts.getOrNull(0)?.toLongOrNull()
            val requestedEnd = parts.getOrNull(1)?.toLongOrNull()
            if (requestedStart != null) {
                start = requestedStart.coerceIn(0L, length - 1L)
                end = (requestedEnd ?: (length - 1L)).coerceIn(start, length - 1L)
                partial = true
            } else if (requestedEnd != null && requestedEnd > 0L) {
                start = (length - requestedEnd).coerceAtLeast(0L)
                partial = true
            }
        }

        val input = FileInputStream(f)
        try {
            input.channel.position(start)
        } catch (e: Exception) {
            input.close()
            throw e
        }
        val bytesToSend = if (length == 0L) 0L else end - start + 1L
        val limited = object : java.io.FilterInputStream(input) {
            private var remaining = bytesToSend
            override fun read(): Int {
                if (remaining <= 0L) return -1
                val value = super.read()
                if (value >= 0) remaining--
                return value
            }
            override fun read(buffer: ByteArray, offset: Int, count: Int): Int {
                if (remaining <= 0L) return -1
                val n = super.read(buffer, offset, minOf(count.toLong(), remaining).toInt())
                if (n > 0) remaining -= n.toLong()
                return n
            }
        }
        val headers = mutableMapOf(
            "Accept-Ranges" to "bytes",
            "Access-Control-Allow-Origin" to "*",
            "Cache-Control" to "no-store",
            "Content-Length" to bytesToSend.toString()
        )
        if (partial) headers["Content-Range"] = "bytes $start-$end/$length"
        return WebResourceResponse(
            FileOps.mime(f.name),
            null,
            if (partial) 206 else 200,
            if (partial) "Partial Content" else "OK",
            headers,
            limited
        )
    }

    // ---------- Permisos ----------

    private fun runtimePerms(): Array<String> =
        if (Build.VERSION.SDK_INT >= 33) arrayOf(
            Manifest.permission.READ_MEDIA_IMAGES,
            Manifest.permission.READ_MEDIA_VIDEO,
            Manifest.permission.READ_MEDIA_AUDIO
        ) else arrayOf(
            Manifest.permission.READ_EXTERNAL_STORAGE,
            Manifest.permission.WRITE_EXTERNAL_STORAGE
        )

    private fun hasRuntime(): Boolean =
        runtimePerms().all { ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED }

    private fun hasAllFiles(): Boolean =
        if (Build.VERSION.SDK_INT >= 30) Environment.isExternalStorageManager() else hasRuntime()

    private fun requestAllFiles() {
        if (Build.VERSION.SDK_INT < 30 || Environment.isExternalStorageManager()) return
        try {
            startActivity(
                Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION, Uri.parse("package:$packageName"))
            )
        } catch (e: Exception) {
            startActivity(Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION))
        }
    }

    private fun requestAllPermissions() {
        // Android 11+ usa el permiso especial de administración de archivos.
        // No debemos bloquear su solicitud esperando permisos de medios, que son independientes.
        if (Build.VERSION.SDK_INT >= 30) {
            requestAllFiles()
            return
        }
        if (!hasRuntime()) {
            ActivityCompat.requestPermissions(this, runtimePerms(), 100)
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 100) {
            requestAllFiles()
            web.evaluateJavascript("window.WFM && WFM.onResume && WFM.onResume()", null)
        }
    }

    // ---------- Puente JS <-> Kotlin ----------

    inner class Bridge {
        @JavascriptInterface
        fun mediaNotification(title: String, playing: Boolean, duration: Long, position: Long) {
            runOnUiThread { updateMediaNotification(title, playing, duration, position) }
        }

        @JavascriptInterface
        fun call(id: Int, method: String, args: String) {
            pool.execute {
                val res = JSONObject()
                try {
                    res.put("ok", true)
                    res.put("data", dispatch(method, JSONObject(args)) ?: JSONObject.NULL)
                } catch (t: Throwable) {
                    res.put("ok", false)
                    res.put("error", t.message ?: t.javaClass.simpleName)
                }
                val js = "WFM_CB($id,${JSONObject.quote(res.toString())})"
                runOnUiThread { if (!isDestroyed) web.evaluateJavascript(js, null) }
            }
        }
    }

    private fun dispatch(m: String, a: JSONObject): Any? = when (m) {
        "perm" -> JSONObject()
            .put("all", hasAllFiles())
            .put("legacy", hasRuntime())
            .put("media", hasRuntime())
            .put("sdk", Build.VERSION.SDK_INT)
        "reqPerm" -> { runOnUiThread { requestAllPermissions() }; true }
        "roots" -> FileOps.roots(this)
        "list" -> FileOps.list(a)
        "stat" -> FileOps.stat(a.getString("path"))
        "mkdir" -> FileOps.mkdir(a.getString("path"), a.getString("name"))
        "newFile" -> FileOps.newFile(a.getString("path"), a.getString("name"), a.optString("content", ""))
        "rename" -> FileOps.rename(a.getString("path"), a.getString("name"))
        "delete" -> FileOps.delete(a.getJSONArray("paths"))
        "copy" -> FileOps.copy(a.getJSONArray("paths"), a.getString("dest"), false)
        "move" -> FileOps.copy(a.getJSONArray("paths"), a.getString("dest"), true)
        "readText" -> FileOps.readText(a.getString("path"))
        "writeText" -> { FileOps.writeText(a.getString("path"), a.getString("text")); true }
        "search" -> FileOps.search(a)
        "category" -> FileOps.category(a)
        "zipList" -> FileOps.zipList(a.getString("path"))
        "zipRead" -> FileOps.zipRead(a.getString("path"), a.getString("entry"))
        "zipExtract" -> FileOps.zipExtract(a.getString("path"), a.getString("dest"), a.optJSONArray("entries"))
        "zipCreate" -> FileOps.zipCreate(a.getJSONArray("paths"), a.getString("dest"), a.getString("name"))
        "open" -> { openFile(a.getString("path")); true }
        "playVideo" -> { playVideo(a.getString("path")); true }
        "mediaNotification" -> { runOnUiThread { updateMediaNotification(a.optString("title", "Audio"), a.optBoolean("playing"), a.optLong("duration"), a.optLong("position")) }; true }
        "requestDefaultFileManager" -> { requestDefaultFileManager(); true }
        "imageThumbnail" -> imageThumbnail(a.getString("path"))
        "pdfThumbnail" -> pdfThumbnail(a.getString("path"))
        "videoThumbnail" -> videoThumbnail(a.getString("path"))
        "zipInstallApk" -> { installApkFromZip(a.getString("path"), a.getString("entry")); true }
        "share" -> { shareFiles(a.getJSONArray("paths")); true }
        else -> throw IllegalArgumentException("Método desconocido: $m")
    }

    private fun playVideo(path: String) {
        val file = File(path)
        if (!file.isFile || !file.canRead()) throw IllegalArgumentException("Vídeo no disponible")
        runOnUiThread {
            try {
                val dialog = Dialog(this, android.R.style.Theme_Black_NoTitleBar_Fullscreen)
                val video = VideoView(this)
                video.setBackgroundColor(Color.BLACK)
                val controller = MediaController(this)
                controller.setAnchorView(video)
                video.setMediaController(controller)
                dialog.setContentView(video, FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT
                ))
                video.setOnPreparedListener { player ->
                    player.isLooping = false
                    video.start()
                    controller.show(2500)
                }
                video.setOnErrorListener { _, what, extra ->
                    Toast.makeText(this, "No se pudo reproducir este vídeo (error $what/$extra). Prueba con MP4 H.264/AAC o con otra aplicación.", Toast.LENGTH_LONG).show()
                    dialog.dismiss()
                    true
                }
                dialog.setOnDismissListener { if (video.isPlaying) video.stopPlayback() }
                dialog.show()
                video.setVideoPath(file.absolutePath)
            } catch (t: Throwable) {
                Toast.makeText(this, "No se pudo abrir el vídeo: " + t.message, Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun createMediaNotificationChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(NotificationChannel(
                mediaChannelId, "Reproducción de audio", NotificationManager.IMPORTANCE_LOW
            ).apply { description = "Controles de audio de W File Manager" })
        }
    }

    private fun updateMediaNotification(title: String, playing: Boolean, duration: Long, position: Long) {
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            if (playing) ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 4108)
            return
        }
        val command = if (playing) "pause" else "play"
        val actionIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("wfm_media_command", command)
        }
        val actionPending = PendingIntent.getActivity(
            this, if (playing) 4109 else 4110, actionIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val builder = NotificationCompat.Builder(this, mediaChannelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title.ifBlank { "Audio" })
            .setContentText(if (playing) "Reproduciendo · W File Manager" else "En pausa · W File Manager")
            .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOnlyAlertOnce(true)
            .setOngoing(playing)
            .setContentIntent(PendingIntent.getActivity(
                this, 4111, Intent(this, MainActivity::class.java),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            ))
            .addAction(
                if (playing) android.R.drawable.ic_media_pause else android.R.drawable.ic_media_play,
                if (playing) "Pausar" else "Reproducir",
                actionPending
            )
        if (!playing && position <= 0L) {
            getSystemService(NotificationManager::class.java).cancel(mediaNotificationId)
        } else {
            getSystemService(NotificationManager::class.java).notify(mediaNotificationId, builder.build())
        }
    }

    private fun requestDefaultFileManager() {
        if (Build.VERSION.SDK_INT >= 29) {
            val roleManager = getSystemService(RoleManager::class.java)
            if (roleManager != null && roleManager.isRoleAvailable(filesRoleName)) {
                if (!roleManager.isRoleHeld(RoleManager.ROLE_FILES)) {
                    startActivityForResult(roleManager.createRequestRoleIntent(RoleManager.ROLE_FILES), 4112)
                } else {
                    Toast.makeText(this, "W File Manager ya es el administrador de archivos predeterminado.", Toast.LENGTH_LONG).show()
                }
                return
            }
        }
        try {
            startActivity(Intent(Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS))
        } catch (_: Exception) {
            startActivity(Intent(Settings.ACTION_SETTINGS))
        }
    }

    private fun imageThumbnail(path: String): JSONObject {
        val file = File(path)
        if (!file.isFile || !file.canRead()) throw IllegalArgumentException("Imagen no disponible")
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(file.absolutePath, bounds)
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) {
            throw IllegalArgumentException("Formato de imagen no compatible")
        }
        var sample = 1
        while (bounds.outWidth / sample > 640 || bounds.outHeight / sample > 640) sample *= 2
        val bitmap = BitmapFactory.decodeFile(file.absolutePath, BitmapFactory.Options().apply {
            inSampleSize = sample
            inPreferredConfig = Bitmap.Config.RGB_565
        }) ?: throw IllegalArgumentException("No se pudo generar la miniatura de imagen")
        return try {
            val width = 320
            val height = maxOf(1, (width.toFloat() * bitmap.height / bitmap.width).toInt())
            val scaled = Bitmap.createScaledBitmap(bitmap, width, height, true)
            if (scaled !== bitmap) bitmap.recycle()
            ByteArrayOutputStream().use { out ->
                scaled.compress(Bitmap.CompressFormat.JPEG, 78, out)
                scaled.recycle()
                JSONObject().put("b64", Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP))
            }
        } catch (t: Throwable) {
            if (!bitmap.isRecycled) bitmap.recycle()
            throw t
        }
    }

    private fun pdfThumbnail(path: String): JSONObject {
        val file = File(path)
        if (!file.isFile || !file.canRead() || FileOps.ext(file.name) != "pdf") {
            throw IllegalArgumentException("PDF no disponible")
        }
        val encoded = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY).use { fd ->
            PdfRenderer(fd).use { renderer ->
                if (renderer.pageCount < 1) throw IllegalArgumentException("PDF vacío")
                renderer.openPage(0).use { page ->
                    val width = 240
                    val height = maxOf(1, (width.toFloat() * page.height / page.width).toInt())
                    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                    bitmap.eraseColor(Color.WHITE)
                    page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                    ByteArrayOutputStream().use { out ->
                        bitmap.compress(Bitmap.CompressFormat.JPEG, 76, out)
                        bitmap.recycle()
                        Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
                    }
                }
            }
        }
        return JSONObject().put("b64", encoded)
    }

    private fun videoThumbnail(path: String): JSONObject {
        val file = File(path)
        if (!file.isFile || !file.canRead()) throw IllegalArgumentException("Vídeo no disponible")
        val retriever = MediaMetadataRetriever()
        val bitmap = try {
            retriever.setDataSource(file.absolutePath)
            retriever.getFrameAtTime(1_000_000L, MediaMetadataRetriever.OPTION_CLOSEST_SYNC)
                ?: retriever.getFrameAtTime(0L, MediaMetadataRetriever.OPTION_CLOSEST)
                ?: throw IllegalStateException("No se pudo generar la miniatura del vídeo")
        } finally {
            retriever.release()
        }
        return try {
            val width = 320
            val height = maxOf(1, (width.toFloat() * bitmap.height / bitmap.width).toInt())
            val scaled = Bitmap.createScaledBitmap(bitmap, width, height, true)
            if (scaled !== bitmap) bitmap.recycle()
            ByteArrayOutputStream().use { out ->
                scaled.compress(Bitmap.CompressFormat.JPEG, 78, out)
                scaled.recycle()
                JSONObject().put("b64", Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP))
            }
        } catch (t: Throwable) {
            if (!bitmap.isRecycled) bitmap.recycle()
            throw t
        }
    }

    private fun installApkFromZip(zipPath: String, entryName: String) {
        if (!entryName.lowercase().endsWith(".apk") || entryName.endsWith("/")) {
            throw IllegalArgumentException("La entrada seleccionada no es un APK")
        }
        val tempDir = File(cacheDir, "zip-apk").apply {
            if (!exists() && !mkdirs()) throw IllegalStateException("No se pudo preparar el instalador")
        }
        val outFile = File.createTempFile("wfm-install-", ".apk", tempDir)
        try {
            java.util.zip.ZipFile(zipPath).use { zip ->
                val entry = zip.getEntry(entryName) ?: throw IllegalArgumentException("No se encontró el APK dentro del ZIP")
                if (entry.isDirectory) throw IllegalArgumentException("La entrada no es un archivo")
                var copied = 0L
                zip.getInputStream(entry).use { input ->
                    outFile.outputStream().buffered().use { output ->
                        val buffer = ByteArray(64 * 1024)
                        while (true) {
                            val count = input.read(buffer)
                            if (count < 0) break
                            copied += count
                            if (copied > 700L * 1024L * 1024L) throw IllegalArgumentException("El APK supera el límite de 700 MB")
                            output.write(buffer, 0, count)
                        }
                    }
                }
            }
            if (outFile.length() == 0L) throw IllegalArgumentException("El APK está vacío")
            val uri = uriFor(outFile)
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/vnd.android.package-archive")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            try {
                startActivity(intent)
            } catch (e: ActivityNotFoundException) {
                throw IllegalStateException("Android no encontró el instalador de paquetes")
            }
        } catch (t: Throwable) {
            outFile.delete()
            throw t
        }
    }

    private fun uriFor(f: File): Uri = FileProvider.getUriForFile(this, "$packageName.fileprovider", f)

    private fun openFile(path: String) {
        val f = File(path)
        val i = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uriFor(f), FileOps.mime(f.name))
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        try {
            startActivity(i)
        } catch (e: ActivityNotFoundException) {
            throw IllegalStateException("No hay ninguna app para abrir este archivo")
        }
    }

    private fun shareFiles(paths: JSONArray) {
        // Mantener solo archivos reales y usar esa misma lista para URI y MIME.
        // Así una carpeta seleccionada antes que un archivo no altera el tipo compartido.
        val files = ArrayList<File>()
        for (i in 0 until paths.length()) {
            val f = File(paths.getString(i))
            if (f.isFile && f.canRead()) files.add(f)
        }
        if (files.isEmpty()) throw IllegalStateException("Solo se pueden compartir archivos (no carpetas)")
        val uris = ArrayList<Uri>()
        files.forEach { uris.add(uriFor(it)) }
        val intent = if (uris.size == 1) {
            Intent(Intent.ACTION_SEND).apply {
                putExtra(Intent.EXTRA_STREAM, uris[0])
                type = FileOps.mime(files[0].name)
            }
        } else {
            Intent(Intent.ACTION_SEND_MULTIPLE).apply {
                putParcelableArrayListExtra(Intent.EXTRA_STREAM, uris)
                type = "*/*"
            }
        }
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        startActivity(Intent.createChooser(intent, "Compartir").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
}
