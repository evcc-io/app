package expo.modules.clientcert

import java.security.KeyStore
import java.security.PrivateKey
import java.security.cert.X509Certificate

object ClientCertStore {
    private var privateKey: PrivateKey? = null
    private var certificateChain: Array<X509Certificate>? = null

    @JvmStatic
    fun getPrivateKey(): PrivateKey? = privateKey

    @JvmStatic
    fun getCertificateChain(): Array<X509Certificate>? = certificateChain

    fun setCert(p12Base64: String, pass: String) {
        try {
            val bytes = android.util.Base64.decode(p12Base64, android.util.Base64.DEFAULT)
            val ks = KeyStore.getInstance("PKCS12")
            ks.load(java.io.ByteArrayInputStream(bytes), pass.toCharArray())
            val aliases = ks.aliases()
            if (aliases.hasMoreElements()) {
                val alias = aliases.nextElement()
                privateKey = ks.getKey(alias, pass.toCharArray()) as PrivateKey
                val certs = ks.getCertificateChain(alias)
                certificateChain = certs?.map { it as X509Certificate }?.toTypedArray()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            clear()
            throw e
        }
    }

    fun clear() {
        privateKey = null
        certificateChain = null
    }
}
