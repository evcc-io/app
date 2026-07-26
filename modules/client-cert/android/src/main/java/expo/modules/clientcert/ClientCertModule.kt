package expo.modules.clientcert

import android.webkit.ClientCertRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ClientCertModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ClientCert")

    Function("setCertificate") { p12Base64: String, pass: String ->
      ClientCertStore.setCert(p12Base64, pass)
      installClientCertHandlerIfNeeded()
    }

    Function("clearCertificate") {
      ClientCertStore.clear()
    }
  }

  private fun installClientCertHandlerIfNeeded() {
    val activity = appContext.currentActivity ?: return
    activity.runOnUiThread {
      // Walk the view hierarchy and patch every WebView we find
      val rootView = activity.window.decorView
      patchWebViews(rootView)
    }
  }

  private fun patchWebViews(view: android.view.View) {
    if (view is WebView) {
      // Only install once – check the current client type
      val existing = view.tag as? Boolean
      if (existing != true) {
        view.tag = true
        val originalClient = view.webViewClient
        view.webViewClient = object : WebViewClient() {
          override fun onReceivedClientCertRequest(
            view: WebView,
            request: ClientCertRequest
          ) {
            val key = ClientCertStore.getPrivateKey()
            val chain = ClientCertStore.getCertificateChain()
            if (key != null && chain != null) {
              request.proceed(key, chain)
            } else {
              request.cancel()
            }
          }

          // Forward all other methods to original client
          override fun shouldOverrideUrlLoading(
            view: WebView,
            url: String
          ) = originalClient.shouldOverrideUrlLoading(view, url)

          override fun onPageStarted(
            view: WebView,
            url: String,
            favicon: android.graphics.Bitmap?
          ) = originalClient.onPageStarted(view, url, favicon)

          override fun onPageFinished(view: WebView, url: String) =
            originalClient.onPageFinished(view, url)

          override fun onReceivedError(
            view: WebView,
            request: android.webkit.WebResourceRequest,
            error: android.webkit.WebResourceError
          ) = originalClient.onReceivedError(view, request, error)

          override fun onReceivedHttpError(
            view: WebView,
            request: android.webkit.WebResourceRequest,
            errorResponse: android.webkit.WebResourceResponse
          ) = originalClient.onReceivedHttpError(view, request, errorResponse)

          override fun onReceivedSslError(
            view: WebView,
            handler: android.webkit.SslErrorHandler,
            error: android.net.http.SslError
          ) = originalClient.onReceivedSslError(view, handler, error)
        }
      }
    }
    if (view is android.view.ViewGroup) {
      for (i in 0 until view.childCount) {
        patchWebViews(view.getChildAt(i))
      }
    }
  }
}
