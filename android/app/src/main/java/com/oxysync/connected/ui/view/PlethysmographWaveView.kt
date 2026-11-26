package com.oxysync.connected.ui.view

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.Shader
import android.util.AttributeSet
import android.view.View
import kotlin.math.PI
import kotlin.math.sin

class PlethysmographWaveView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val nominalColor = Color.parseColor("#00E5FF")
    private val hypoxemicColor = Color.parseColor("#EF4444")

    private val linePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = nominalColor
        strokeWidth = 4.5f
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
    }

    private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }

    private val gridPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#152238")
        strokeWidth = 1.0f
        style = Paint.Style.STROKE
    }

    private val wavePath = Path()
    private val fillPath = Path()

    private var phase = 0f
    private var pulseRateBpm = 74
    private var spo2Pct = 98.2f
    private var isConnected = true

    private var cachedWidth = 0f
    private var cachedHeight = 0f
    private var cachedHypoxemic = false

    fun updateVitals(bpm: Int, spo2: Float, connected: Boolean) {
        this.pulseRateBpm = if (bpm in 40..180) bpm else 74
        this.spo2Pct = spo2
        this.isConnected = connected
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        val w = width.toFloat()
        val h = height.toFloat()
        if (w <= 0f || h <= 0f) return

        drawGrid(canvas, w, h)

        val isHypoxemic = spo2Pct < 90f
        linePaint.color = if (isHypoxemic) hypoxemicColor else nominalColor

        if (!isConnected) {
            canvas.drawLine(0f, h / 2f, w, h / 2f, linePaint)
            return
        }

        val midY = h * 0.55f
        val clampedSpo2 = spo2Pct.coerceIn(50f, 100f)
        val maxAmp = h * 0.35f * (clampedSpo2 / 100f)

        if (w != cachedWidth || h != cachedHeight || isHypoxemic != cachedHypoxemic || fillPaint.shader == null) {
            cachedWidth = w
            cachedHeight = h
            cachedHypoxemic = isHypoxemic
            val fillStartColor = Color.parseColor(if (isHypoxemic) "#33EF4444" else "#3300E5FF")
            fillPaint.shader = LinearGradient(
                0f, midY - maxAmp, 0f, h,
                fillStartColor,
                Color.TRANSPARENT,
                Shader.TileMode.CLAMP
            )
        }

        wavePath.reset()
        fillPath.reset()
        fillPath.moveTo(0f, h)

        val stepPx = 4f
        var x = 0f
        var first = true
        val twoPi = 2f * PI.toFloat()
        val cycleFrequency = (pulseRateBpm / 60f) * 0.05f

        while (x <= w) {
            val t = (x * 0.015f - phase) * twoPi
            val normalizedT = (t % twoPi + twoPi) % twoPi
            val yOffset = calculatePpgSample(normalizedT) * maxAmp
            val y = midY - yOffset

            if (first) {
                wavePath.moveTo(x, y)
                fillPath.lineTo(x, y)
                first = false
            } else {
                wavePath.lineTo(x, y)
                fillPath.lineTo(x, y)
            }
            x += stepPx
        }

        fillPath.lineTo(w, h)
        fillPath.close()

        canvas.drawPath(fillPath, fillPaint)
        canvas.drawPath(wavePath, linePaint)

        phase += cycleFrequency * 0.6f
        postInvalidateOnAnimation()
    }

    private fun calculatePpgSample(theta: Float): Float {
        val s1 = sin(theta)
        val s2 = 0.35f * sin(2f * theta - 0.5f)
        val s3 = 0.15f * sin(3f * theta - 1.0f)
        return (s1 + s2 + s3).coerceAtLeast(-0.2f)
    }

    private fun drawGrid(canvas: Canvas, w: Float, h: Float) {
        val gridStep = 40f
        var x = 0f
        while (x <= w) {
            canvas.drawLine(x, 0f, x, h, gridPaint)
            x += gridStep
        }
        var y = 0f
        while (y <= h) {
            canvas.drawLine(0f, y, w, y, gridPaint)
            y += gridStep
        }
    }
}
