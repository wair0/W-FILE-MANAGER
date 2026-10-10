package com.w.files

import java.io.InputStream
import java.io.OutputStream
import java.security.SecureRandom
import java.util.Arrays
import javax.crypto.Cipher
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec

/**
 * AES-GCM file format (version 1):
 * magic[4]="WFM1" | version[1]=1 | salt[16] | nonce[12] | ciphertext+tag
 * Key: PBKDF2-HMAC-SHA256, 120_000 iterations, 256-bit key.
 * Password held only in memory while unlocked; never written to disk.
 */
object CryptoHelper {
    private const val MAGIC = "WFM1"
    private const val VERSION: Byte = 1
    private const val SALT_LEN = 16
    private const val NONCE_LEN = 12
    private const val TAG_BITS = 128
    private const val KEY_BITS = 256
    private const val ITERATIONS = 120_000
    private const val BUFFER = 64 * 1024

    @Volatile
    private var sessionPassword: CharArray? = null

    fun isUnlocked(): Boolean = sessionPassword != null

    fun unlock(password: String): Boolean {
        if (password.length < 6) return false
        lock()
        sessionPassword = password.toCharArray()
        return true
    }

    fun lock() {
        sessionPassword?.let { Arrays.fill(it, '\u0000') }
        sessionPassword = null
    }

    fun isEncryptedHeader(header: ByteArray): Boolean {
        if (header.size < 4) return false
        return header[0] == 'W'.code.toByte() &&
            header[1] == 'F'.code.toByte() &&
            header[2] == 'M'.code.toByte() &&
            header[3] == '1'.code.toByte()
    }

    fun encryptStream(input: InputStream, output: OutputStream) {
        val password = sessionPassword ?: throw IllegalStateException("Carpeta segura bloqueada")
        val salt = ByteArray(SALT_LEN).also { SecureRandom().nextBytes(it) }
        val nonce = ByteArray(NONCE_LEN).also { SecureRandom().nextBytes(it) }
        val key = deriveKey(password, salt)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, key, GCMParameterSpec(TAG_BITS, nonce))

        output.write(MAGIC.toByteArray(Charsets.US_ASCII))
        output.write(byteArrayOf(VERSION))
        output.write(salt)
        output.write(nonce)

        val buf = ByteArray(BUFFER)
        while (true) {
            val n = input.read(buf)
            if (n <= 0) break
            val out = cipher.update(buf, 0, n)
            if (out != null) output.write(out)
        }
        val finalBytes = cipher.doFinal()
        if (finalBytes != null) output.write(finalBytes)
        output.flush()
    }

    fun decryptStream(input: InputStream, output: OutputStream) {
        val password = sessionPassword ?: throw IllegalStateException("Carpeta segura bloqueada")
        val magic = ByteArray(4)
        if (input.read(magic) != 4 || !isEncryptedHeader(magic)) {
            throw IllegalArgumentException("Formato cifrado no reconocido")
        }
        val version = input.read()
        if (version != VERSION.toInt()) {
            throw IllegalArgumentException("Versión de cifrado no soportada")
        }
        val salt = ByteArray(SALT_LEN)
        val nonce = ByteArray(NONCE_LEN)
        if (input.read(salt) != SALT_LEN || input.read(nonce) != NONCE_LEN) {
            throw IllegalArgumentException("Cabecera incompleta")
        }
        val key = deriveKey(password, salt)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, key, GCMParameterSpec(TAG_BITS, nonce))

        val buf = ByteArray(BUFFER)
        while (true) {
            val n = input.read(buf)
            if (n <= 0) break
            val out = cipher.update(buf, 0, n)
            if (out != null) output.write(out)
        }
        val finalBytes = cipher.doFinal()
        if (finalBytes != null) output.write(finalBytes)
        output.flush()
    }

    private fun deriveKey(password: CharArray, salt: ByteArray): SecretKeySpec {
        val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
        val spec = PBEKeySpec(password, salt, ITERATIONS, KEY_BITS)
        try {
            val keyBytes = factory.generateSecret(spec).encoded
            return SecretKeySpec(keyBytes, "AES")
        } finally {
            spec.clearPassword()
        }
    }
}
