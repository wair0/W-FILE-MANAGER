package com.w.files

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import org.json.JSONObject

class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView
    private var selectedTreeUri: Uri? = null

    private val folderPicker = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            val uri = result.data?.data
            if (uri != null) {
                val flags = result.data?.flags ?: 0
                val persistableFlags = flags and (
                    Intent.FLAG_GRANT_READ_URI_PERMISSION or
                        Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                    )
                try {
                    contentResolver.takePersistableUriPermission(uri, persistableFlags)
                    selectedTreeUri = uri
                    notifyWeb("onFolderAccessResult", JSONObject()
                        .put("granted", true)
                        .put("uri", uri.toString())
                        .put("message", "Acceso a la carpeta concedido. El listado se conectará en la siguiente etapa.")
                    )
                } catch (_: SecurityException) {
                    notifyWeb("onFolderAccessResult", JSONObject()
                        .put("granted", false)
                        .put("message", "Android no permitió conservar el acceso a esta carpeta.")
                    )
                }
            } else {
                notifyWeb("onFolderAccessResult", JSONObject()
                    .put("granted", false).put("message", "No se seleccionó ninguna carpeta.")
                )
            }
        } else {
            notifyWeb("onFolderAccessResult", JSONObject()
                .put("granted", false).put("message", "Selección cancelada.")
            )
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            settings.allowFileAccessFromFileURLs = false
            settings.allowUniversalAccessFromFileURLs = false
            settings.javaScriptCanOpenWindowsAutomatically = false
            settings.setSupportMultipleWindows(false)
            settings.safeBrowsingEnabled = true
            webViewClient = object : WebViewClientCompat() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: android.webkit.WebResourceRequest
                ): android.webkit.WebResourceResponse? =
                    assetLoader.shouldInterceptRequest(request.url)

                override fun shouldOverrideUrlLoading(
                    view: WebView,
                    request: android.webkit.WebResourceRequest
                ): Boolean = request.url.scheme != "https" ||
                    request.url.host != "appassets.androidplatform.net"
            }
            addJavascriptInterface(UiBridge(), "WFileNative")
            loadUrl("https://appassets.androidplatform.net/assets/www/index.html")
        }
        setContentView(webView)
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (::webView.isInitialized && webView.canGoBack()) webView.goBack() else finish()
            }
        })
    }

    private fun notifyWeb(callback: String, payload: JSONObject) {
        if (!::webView.isInitialized || isFinishing) return
        val quoted = JSONObject.quote(payload.toString())
        webView.post {
            webView.evaluateJavascript("window.$callback && window.$callback(JSON.parse($quoted));", null)
        }
    }

    override fun onDestroy() {
        if (::webView.isInitialized) {
            webView.removeJavascriptInterface("WFileNative")
            webView.stopLoading()
            webView.loadUrl("about:blank")
            webView.destroy()
        }
        super.onDestroy()
    }

    inner class UiBridge {
        @JavascriptInterface
        fun getAppInfo(): String = JSONObject()
            .put("name", "W FILE MANAGER").put("version", "0.1.0").put("status", "ready").toString()

        @JavascriptInterface
        fun requestFolderAccess() {
            runOnUiThread {
                val intent = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE).apply {
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
                    addFlags(Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION)
                    addFlags(Intent.FLAG_GRANT_PREFIX_URI_PERMISSION)
                }
                folderPicker.launch(intent)
            }
        }

        @JavascriptInterface
        fun hasFolderAccess(): Boolean = selectedTreeUri != null
    }
}
