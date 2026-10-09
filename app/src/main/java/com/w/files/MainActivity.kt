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
    private var currentDocumentId: String? = null
    private val directoryStack = ArrayDeque<String>()

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
                    currentDocumentId = DocumentsContract.getTreeDocumentId(uri)
                    directoryStack.clear()
                    notifyWeb("onFolderAccessResult", JSONObject().put("granted", true).put("message", "Acceso concedido. Cargando contenido…"))
                    runCatching { directoryPayload() }.onSuccess { notifyWeb("onDirectoryResult", it) }.onFailure { notifyWeb("onDirectoryResult", JSONObject().put("error", "No se pudo leer esta carpeta.").put("items", JSONArray())) }
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
                if (directoryStack.isNotEmpty()) {
                    directoryStack.removeLast()
                    currentDocumentId = directoryStack.lastOrNull() ?: selectedTreeUri?.let { DocumentsContract.getTreeDocumentId(it) }
                    runCatching { directoryPayload() }.onSuccess { notifyWeb("onDirectoryResult", it) }
                } else if (::webView.isInitialized && webView.canGoBack()) webView.goBack() else finish()
            }
        })
    }

    private fun listDirectory(treeUri: Uri, documentId: String): JSONArray {
        val result = JSONArray()
        val childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(treeUri, documentId)
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

    private fun directoryPayload(): JSONObject {
        val tree = selectedTreeUri ?: return JSONObject().put("error", "Seleccioná una carpeta primero.").put("items", JSONArray())
        val id = currentDocumentId ?: DocumentsContract.getTreeDocumentId(tree)
        return JSONObject().put("items", listDirectory(tree, id)).put("pathDepth", directoryStack.size).put("canGoUp", directoryStack.isNotEmpty())
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
            selectedTreeUri ?: return JSONObject().put("error", "Seleccioná una carpeta primero.").put("items", JSONArray()).toString()
            return try {
                directoryPayload().toString()
            } catch (_: SecurityException) {
                selectedTreeUri = null
                JSONObject().put("error", "El permiso de la carpeta fue revocado.")
                    .put("items", JSONArray()).toString()
            } catch (_: Exception) {
                JSONObject().put("error", "No se pudo leer el contenido de esta carpeta.")
                    .put("items", JSONArray()).toString()
            }
        }
        @JavascriptInterface
        fun openDirectory(documentId: String): String {
            val tree = selectedTreeUri ?: return JSONObject().put("error", "Seleccioná una carpeta primero.").put("items", JSONArray()).toString()
            return try {
                val parentId = currentDocumentId ?: DocumentsContract.getTreeDocumentId(tree)
                val directChild = listDirectory(tree, parentId).let { items ->
                    (0 until items.length()).any { index ->
                        val item = items.getJSONObject(index)
                        item.optString("id") == documentId && item.optBoolean("directory")
                    }
                }
                if (documentId.isBlank() || !directChild) JSONObject().put("error", "La carpeta ya no está disponible.").put("items", JSONArray()).toString()
                else {
                    directoryStack.addLast(parentId)
                    currentDocumentId = documentId
                    directoryPayload().toString()
                }
            } catch (_: SecurityException) {
                selectedTreeUri = null
                currentDocumentId = null
                directoryStack.clear()
                JSONObject().put("error", "El permiso de la carpeta fue revocado.").put("items", JSONArray()).toString()
            } catch (_: Exception) {
                JSONObject().put("error", "No se pudo abrir esta carpeta.").put("items", JSONArray()).toString()
            }
        }

        @JavascriptInterface
        fun goToRoot(): String {
            val tree = selectedTreeUri ?: return JSONObject().put("error", "Seleccioná una carpeta primero.").put("items", JSONArray()).toString()
            return try {
                directoryStack.clear()
                currentDocumentId = DocumentsContract.getTreeDocumentId(tree)
                directoryPayload().toString()
            } catch (_: Exception) {
                JSONObject().put("error", "No se pudo volver a la carpeta inicial.").put("items", JSONArray()).toString()
            }
        }

        @JavascriptInterface
        fun openFile(documentId: String): Boolean {
            val tree = selectedTreeUri ?: return false
            return try {
                val parentId = currentDocumentId ?: DocumentsContract.getTreeDocumentId(tree)
                val item = listDirectory(tree, parentId).let { items ->
                    (0 until items.length()).map { items.getJSONObject(it) }.firstOrNull {
                        it.optString("id") == documentId && !it.optBoolean("directory")
                    }
                } ?: return false
                val uri = DocumentsContract.buildDocumentUriUsingTree(tree, item.getString("id"))
                startActivity(Intent(Intent.ACTION_VIEW).setDataAndType(uri, item.optString("mimeType", "*/*")).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION))
                true
            } catch (_: Exception) { false }
        }

    }
}
