package io.evcc.android.widget

import java.util.Locale

/**
 * Kotlin port of a SUBSET of evcc's web formatter (mirrors iOS Format.swift):
 * https://github.com/evcc-io/evcc/blob/master/assets/js/mixins/formatter.ts
 * Numbers use the device locale.
 */
object Format {
    private val CURRENCY_SYMBOLS = mapOf(
        "AUD" to "$", "BGN" to "лв", "BRL" to "R$", "CAD" to "$", "CHF" to "Fr.", "CNY" to "¥",
        "CZK" to "Kč", "EUR" to "€", "GBP" to "£", "HUF" to "Ft", "ILS" to "₪", "JPY" to "¥",
        "NZD" to "$", "NOK" to "kr", "PLN" to "zł", "RON" to "lei", "USD" to "$", "DKK" to "kr",
        "SEK" to "kr", "ZAR" to "R", "TRY" to "₺", "MYR" to "RM",
    )

    // currencies where the energy price is shown in subunits (factor 100)
    private val ENERGY_PRICE_IN_SUBUNIT = mapOf(
        "AUD" to "c", "BGN" to "st", "BRL" to "¢", "CAD" to "¢", "EUR" to "ct", "GBP" to "p",
        "ILS" to "ag", "NZD" to "c", "NOK" to "øre", "PLN" to "gr", "USD" to "¢", "DKK" to "øre",
        "SEK" to "öre", "ZAR" to "c", "TRY" to "krş",
    )

    private fun number(value: Double, decimals: Int, max: Int = decimals): String {
        // format with up to `max` fraction digits, at least `decimals`, in the device locale
        val s = String.format(Locale.getDefault(), "%.${max}f", value)
        if (max <= decimals) return s
        // trim trailing zeros down to `decimals`
        val sep = java.text.DecimalFormatSymbols.getInstance().decimalSeparator
        val dot = s.indexOf(sep)
        if (dot < 0) return s
        var end = s.length
        while (end > dot + 1 + decimals && s[end - 1] == '0') end--
        if (end == dot + 1) end = dot // no fraction left
        return s.substring(0, end)
    }

    private fun energyPriceSubunit(currency: String): String? {
        if (currency == "CHF") {
            return if (Locale.getDefault().language == "de") "Rp." else "ct."
        }
        return ENERGY_PRICE_IN_SUBUNIT[currency]
    }

    fun fmtNumber(value: Double, decimals: Int): String = number(value, decimals)

    /** Power in W, auto-scaled to W/kW/MW. */
    fun fmtW(watt: Double, withUnit: Boolean = true): String {
        val unit: String
        val value: Double
        val digits: Int
        when {
            watt >= 10_000_000 -> { unit = "MW"; value = watt / 1_000_000; digits = 1 }
            watt >= 1000 || watt == 0.0 -> { unit = "kW"; value = watt / 1000; digits = 1 }
            else -> { unit = "W"; value = watt; digits = 0 }
        }
        return number(value, digits) + if (withUnit) " $unit" else ""
    }

    fun fmtWh(watt: Double): String = fmtW(watt) + "h"

    fun fmtCo2(grams: Double): String = "${number(grams, 0)} g/kWh"

    fun pricePerKWhDisplayFactor(currency: String): Double =
        if (energyPriceSubunit(currency) != null) 100.0 else 1.0

    fun pricePerKWhUnit(currency: String): String {
        val unit = energyPriceSubunit(currency) ?: CURRENCY_SYMBOLS[currency] ?: currency
        return "$unit/kWh"
    }

    fun fmtPricePerKWh(amount: Double, currency: String = "EUR", withUnit: Boolean = true): String {
        val value = amount * pricePerKWhDisplayFactor(currency)
        val price = number(value, 1, max = if (energyPriceSubunit(currency) != null) 1 else 3)
        return if (withUnit) "$price ${pricePerKWhUnit(currency)}" else price
    }
}
