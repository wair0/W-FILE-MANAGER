package com.wairo.wfilemanager

import android.Manifest
import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Color
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
                    if (u.host == "wfile.local") return serveFile(u)
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
        web.loadUrl("file:///android_asset/www/index.html")

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                web.evaluateJavascript("window.WFM ? WFM.back() : false") { r ->
                    if (r != "true") finish()
                }
            }
        })
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

    private fun serveFile(u: Uri): WebResourceResponse? {
        val p = u.getQueryParameter("p") ?: return null
        val f = File(p)
        if (!f.isFile || !f.canRead()) return null
        val resp = WebResourceResponse(FileOps.mime(f.name), null, FileInputStream(f))
        resp.responseHeaders = mapOf("Access-Control-Allow-Origin" to "*", "Cache-Control" to "max-age=60")
        return resp
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
        if (!hasRuntime()) {
            ActivityCompat.requestPermissions(this, runtimePerms(), 100)
        } else {
            requestAllFiles()
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
        "share" -> { shareFiles(a.getJSONArray("paths")); true }
        else -> throw IllegalArgumentException("Método desconocido: $m")
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
        val uris = ArrayList<Uri>()
        for (i in 0 until paths.length()) {
            val f = File(paths.getString(i))
            if (f.isFile) uris.add(uriFor(f))
        }
        if (uris.isEmpty()) throw IllegalStateException("Solo se pueden compartir archivos (no carpetas)")
        val intent = if (uris.size == 1) {
            Intent(Intent.ACTION_SEND).apply {
                putExtra(Intent.EXTRA_STREAM, uris[0])
                type = FileOps.mime(File(paths.getString(0)).name)
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
