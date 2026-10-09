package com.w.files

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.DocumentsContract
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import org.json.JSONArray
import org.json.JSONObject

class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView
    @Volatile private var selectedTreeUri: Uri? = null

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
                        .put("message", "Acceso concedido. Cargando contenido…")
                    )
                    notifyWeb("onDirectoryResult", JSONObject().put("items", listDirectory(uri)))
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
        selectedTreeUri = contentResolver.persistedUriPermissions
            .firstOrNull { it.isReadPermission || it.isWritePermission }?.uri

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

    private fun listDirectory(treeUri: Uri): JSONArray {
        val result = JSONArray()
        val childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(
            treeUri, DocumentsContract.getTreeDocumentId(treeUri)
        )
        val projection = arrayOf(
            DocumentsContract.Document.COLUMN_DOCUMENT_ID,
            DocumentsContract.Document.COLUMN_DISPLAY_NAME,
            DocumentsContract.Document.COLUMN_MIME_TYPE,
            DocumentsContract.Document.COLUMN_SIZE,
            DocumentsContract.Document.COLUMN_LAST_MODIFIED
        )
        contentResolver.query(childrenUri, projection, null, null, null)?.use { cursor ->
            val idColumn = cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_DOCUMENT_ID)
            val nameColumn = cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_DISPLAY_NAME)
            val mimeColumn = cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_MIME_TYPE)
            val sizeColumn = cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_SIZE)
            val modifiedColumn = cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_LAST_MODIFIED)
            while (cursor.moveToNext()) {
                val mime = cursor.getString(mimeColumn) ?: "application/octet-stream"
                result.put(JSONObject()
                    .put("id", cursor.getString(idColumn) ?: "")
                    .put("name", cursor.getString(nameColumn) ?: "Sin nombre")
                    .put("mimeType", mime)
                    .put("directory", mime == DocumentsContract.Document.MIME_TYPE_DIR)
                    .put("size", if (cursor.isNull(sizeColumn)) JSONObject.NULL else cursor.getLong(sizeColumn))
                    .put("modified", if (cursor.isNull(modifiedColumn)) JSONObject.NULL else cursor.getLong(modifiedColumn))
                )
            }
        }
        return result
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
            .put("name", "W FILE MANAGER").put("version", "0.2.0").put("status", "ready").toString()

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

        @JavascriptInterface
        fun listFiles(): String {
            val uri = selectedTreeUri ?: return JSONObject()
                .put("error", "Seleccioná una carpeta primero.").put("items", JSONArray()).toString()
            return try {
                JSONObject().put("items", listDirectory(uri)).toString()
            } catch (_: SecurityException) {
                selectedTreeUri = null
                JSONObject().put("error", "El permiso de la carpeta fue revocado.")
                    .put("items", JSONArray()).toString()
            } catch (_: Exception) {
                JSONObject().put("error", "No se pudo leer el contenido de esta carpeta.")
                    .put("items", JSONArray()).toString()
            }
        }
    }
}
