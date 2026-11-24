package com.oxysync.connected.ui.view

import android.content.Context
import android.graphics.*
import android.util.AttributeSet
import android.view.View
import kotlin.math.PI
import kotlin.math.sin

class PlethysmographWaveView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val linePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#00E5FF")
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

    // Real-time animation phase
    private var phase = 0f
    private var pulseRateBpm = 74
    private var spo2Pct = 98.2f
    private var isConnected = true

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
        if (w <= 0 || h <= 0) return

        // 1. Draw subtle medical grid lines
        drawGrid(canvas, w, h)

        if (!isConnected) {
            // Flatline if disconnected
            canvas.drawLine(0f, h / 2f, w, h / 2f, linePaint)
            return
        }

        // 2. Synthesize physiological PPG plethysmogram curve
        // T = 60 / BPM seconds per cardiac cycle
        val midY = h * 0.55f
        val maxAmp = h * 0.35f * (spo2Pct / 100f)

        wavePath.reset()
        fillPath.reset()
        fillPath.moveTo(0f, h)

        val stepPx = 4f
        var x = 0f
        var first = true

        // Phase advance speed tied to BPM: (BPM / 60) cycles per sec
        val cycleFrequency = (pulseRateBpm / 60f) * 0.05f

        while (x <= w) {
            val t = (x * 0.015f - phase) * 2f * PI.toFloat()
            val normalizedT = (t % (2f * PI.toFloat()) + 2f * PI.toFloat()) % (2f * PI.toFloat())

            // Plethysmogram formula: Primary systolic peak + secondary dicrotic notch
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

        // 3. Draw gradient fill under wave
        val gradient = LinearGradient(
            0f, midY - maxAmp, 0f, h,
            Color.parseColor("#3300E5FF"),
            Color.TRANSPARENT,
            Shader.TileMode.CLAMP
        )
        fillPaint.shader = gradient
        canvas.drawPath(fillPath, fillPaint)

        // 4. Draw wave trace
        canvas.drawPath(wavePath, linePaint)

        // Advance animation phase smoothly
        phase += cycleFrequency * 0.6f
        postInvalidateOnAnimation()
    }

    private fun calculatePpgSample(theta: Float): Float {
        // Normalizes 0..2*PI cardiac cycle:
        // Systolic upstroke & peak (0..0.8 rad)
        // Dicrotic notch (1.2..1.8 rad)
        // Diastolic runoff (1.8..2*PI rad)
        val s1 = sin(theta)
        val s2 = 0.35f * sin(2f * theta - 0.5f)
        val s3 = 0.15f * sin(3f * theta - 1.0f)
        var sample = (s1 + s2 + s3)
        if (sample < -0.2f) sample = -0.2f
        return sample
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
