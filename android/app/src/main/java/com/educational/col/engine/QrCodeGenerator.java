package com.educational.col.engine;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

/**
 * Self-contained ISO/IEC 18004 QR Code Generator (Byte Mode, Error Correction Level L, Versions 1-6)
 * with custom Class Of Learners matrix styling (Squares, Rounded Dots, Diamonds).
 */
public class QrCodeGenerator {

    // Total data codewords and ECC codewords per version (1 to 6) at Level L
    private static final int[] VERSION_SIZES = {0, 21, 25, 29, 33, 37, 41};
    private static final int[] DATA_CODEWORDS_L = {0, 19, 34, 55, 80, 108, 136};
    private static final int[] ECC_CODEWORDS_L = {0, 7, 10, 15, 20, 26, 18}; // v6 uses 2 blocks of (68 data, 18 ecc) -> simplified single block for v1-v5
    private static final int[][] ALIGNMENT_POS = {
            {}, {}, {6, 18}, {6, 22}, {6, 26}, {6, 30}
    };

    public static final int STYLE_SQUARE = 0;
    public static final int STYLE_DOTS = 1;
    public static final int STYLE_DIAMOND = 2;

    public static boolean[][] encodeText(String text) {
        byte[] raw = (text == null || text.isEmpty() ? "https://advancedlogiclabs.dpdns.org" : text)
                .getBytes(StandardCharsets.UTF_8);
        if (raw.length > 106) {
            raw = Arrays.copyOf(raw, 106); // Fits in Version 5-L (108 data codewords)
        }

        int version = 1;
        for (int v = 1; v <= 5; v++) {
            if (raw.length + 2 <= DATA_CODEWORDS_L[v]) {
                version = v;
                break;
            }
        }

        int dataCap = DATA_CODEWORDS_L[version];
        int eccLen = ECC_CODEWORDS_L[version];
        byte[] dataCw = new byte[dataCap];

        // Bit buffer: Mode 0100 (4 bits) + Length (8 bits) + payload + terminator
        int bitCapacity = dataCap * 8;
        boolean[] bits = new boolean[bitCapacity];
        int bitIdx = 0;

        // Mode indicator 0100 (Byte mode)
        bits[bitIdx++] = false;
        bits[bitIdx++] = true;
        bits[bitIdx++] = false;
        bits[bitIdx++] = false;

        // Character count indicator (8 bits for v1-9)
        for (int i = 7; i >= 0; i--) {
            bits[bitIdx++] = ((raw.length >> i) & 1) == 1;
        }

        // Payload bytes
        for (byte b : raw) {
            int val = b & 0xFF;
            for (int i = 7; i >= 0; i--) {
                if (bitIdx < bitCapacity) {
                    bits[bitIdx++] = ((val >> i) & 1) == 1;
                }
            }
        }

        // Terminator up to 4 zero bits
        for (int i = 0; i < 4 && bitIdx < bitCapacity; i++) {
            bits[bitIdx++] = false;
        }
        while (bitIdx % 8 != 0 && bitIdx < bitCapacity) {
            bits[bitIdx++] = false;
        }

        // Pack into bytes
        for (int i = 0; i < bitIdx / 8; i++) {
            int b = 0;
            for (int j = 0; j < 8; j++) {
                b = (b << 1) | (bits[i * 8 + j] ? 1 : 0);
            }
            dataCw[i] = (byte) b;
        }

        // Pad bytes 0xEC, 0x11
        int padIdx = bitIdx / 8;
        boolean toggle = true;
        while (padIdx < dataCap) {
            dataCw[padIdx++] = (byte) (toggle ? 0xEC : 0x11);
            toggle = !toggle;
        }

        // Compute Reed-Solomon ECC codewords
        byte[] eccCw = computeReedSolomon(dataCw, eccLen);
        byte[] allCw = new byte[dataCap + eccLen];
        System.arraycopy(dataCw, 0, allCw, 0, dataCap);
        System.arraycopy(eccCw, 0, allCw, dataCap, eccLen);

        int size = VERSION_SIZES[version];
        boolean[][] modules = new boolean[size][size];
        boolean[][] isFunction = new boolean[size][size];

        // Draw function patterns
        drawFinderPattern(modules, isFunction, 3, 3);
        drawFinderPattern(modules, isFunction, size - 4, 3);
        drawFinderPattern(modules, isFunction, 3, size - 4);

        // Timing patterns
        for (int i = 8; i < size - 8; i++) {
            modules[6][i] = (i % 2 == 0);
            isFunction[6][i] = true;
            modules[i][6] = (i % 2 == 0);
            isFunction[i][6] = true;
        }

        // Alignment pattern for v2-v5
        if (version >= 2) {
            int[] pos = ALIGNMENT_POS[version];
            drawAlignmentPattern(modules, isFunction, pos[1], pos[1]);
        }

        // Reserve format info & dark module
        modules[size - 8][8] = true;
        isFunction[size - 8][8] = true;
        for (int i = 0; i < 9; i++) {
            if (i != 6) {
                isFunction[8][i] = true;
                isFunction[i][8] = true;
            }
        }
        for (int i = 0; i < 8; i++) {
            isFunction[8][size - 1 - i] = true;
            isFunction[size - 1 - i][8] = true;
        }

        // Place data bits in zigzag
        int cwBitIdx = 0;
        int totalCwBits = allCw.length * 8;
        for (int right = size - 1; right >= 1; right -= 2) {
            if (right == 6) right = 5;
            for (int vert = 0; vert < size; vert++) {
                for (int j = 0; j < 2; j++) {
                    int x = right - j;
                    boolean upward = ((right + 1) & 2) == 0;
                    int y = upward ? size - 1 - vert : vert;
                    if (!isFunction[y][x] && cwBitIdx < totalCwBits) {
                        int byteVal = allCw[cwBitIdx / 8] & 0xFF;
                        boolean bit = ((byteVal >> (7 - (cwBitIdx % 8))) & 1) == 1;
                        modules[y][x] = bit;
                        cwBitIdx++;
                    }
                }
            }
        }

        // Apply Mask 0: (y + x) % 2 == 0
        for (int y = 0; y < size; y++) {
            for (int x = 0; x < size; x++) {
                if (!isFunction[y][x] && ((y + x) % 2 == 0)) {
                    modules[y][x] = !modules[y][x];
                }
            }
        }

        // Draw format bits for Level L (01) and Mask 0 (000) -> BCH encoded = 0x77C4
        int formatBits = 0x77C4;
        for (int i = 0; i <= 5; i++) modules[8][i] = ((formatBits >> i) & 1) == 1;
        modules[8][7] = ((formatBits >> 6) & 1) == 1;
        modules[8][8] = ((formatBits >> 7) & 1) == 1;
        modules[7][8] = ((formatBits >> 8) & 1) == 1;
        for (int i = 9; i < 15; i++) modules[14 - i][8] = ((formatBits >> i) & 1) == 1;

        for (int i = 0; i < 8; i++) modules[8][size - 1 - i] = ((formatBits >> i) & 1) == 1;
        for (int i = 8; i < 15; i++) modules[size - 15 + i][8] = ((formatBits >> i) & 1) == 1;

        return modules;
    }

    private static void drawFinderPattern(boolean[][] modules, boolean[][] isFunc, int cx, int cy) {
        int size = modules.length;
        for (int dy = -4; dy <= 4; dy++) {
            for (int dx = -4; dx <= 4; dx++) {
                int x = cx + dx;
                int y = cy + dy;
                if (x >= 0 && x < size && y >= 0 && y < size) {
                    int dist = Math.max(Math.abs(dx), Math.abs(dy));
                    modules[y][x] = (dist != 2 && dist != 4);
                    isFunc[y][x] = true;
                }
            }
        }
    }

    private static void drawAlignmentPattern(boolean[][] modules, boolean[][] isFunc, int cx, int cy) {
        for (int dy = -2; dy <= 2; dy++) {
            for (int dx = -2; dx <= 2; dx++) {
                int dist = Math.max(Math.abs(dx), Math.abs(dy));
                modules[cy + dy][cx + dx] = (dist != 1);
                isFunc[cy + dy][cx + dx] = true;
            }
        }
    }

    private static byte[] computeReedSolomon(byte[] data, int degree) {
        byte[] result = new byte[degree];
        byte[] gen = new byte[degree];
        gen[degree - 1] = 1;
        int root = 1;
        for (int i = 0; i < degree; i++) {
            for (int j = 0; j < degree; j++) {
                gen[j] = (byte) gfMultiply(gen[j] & 0xFF, root);
                if (j + 1 < degree) {
                    gen[j] ^= gen[j + 1];
                }
            }
            root = gfMultiply(root, 0x02);
        }

        for (byte b : data) {
            int factor = (b ^ result[0]) & 0xFF;
            System.arraycopy(result, 1, result, 0, degree - 1);
            result[degree - 1] = 0;
            for (int i = 0; i < degree; i++) {
                result[i] ^= (byte) gfMultiply(gen[i] & 0xFF, factor);
            }
        }
        return result;
    }

    private static int gfMultiply(int x, int y) {
        int z = 0;
        for (int i = 7; i >= 0; i--) {
            z = (z << 1) ^ ((z >>> 7) * 0x11D);
            z ^= ((y >>> i) & 1) * x;
        }
        return z;
    }

    public static Bitmap renderQrBitmap(String content, int pixelSize, int fgColor, int bgColor, int style) {
        boolean[][] matrix = encodeText(content);
        int modules = matrix.length;
        int quietZone = 3;
        int totalModules = modules + quietZone * 2;

        Bitmap bmp = Bitmap.createBitmap(pixelSize, pixelSize, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bmp);

        Paint bgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        bgPaint.setColor(bgColor);
        canvas.drawRoundRect(new RectF(0, 0, pixelSize, pixelSize), 36f, 36f, bgPaint);

        Paint fgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        fgPaint.setColor(fgColor);
        fgPaint.setStyle(Paint.Style.FILL);

        float cellSize = (float) pixelSize / totalModules;

        for (int y = 0; y < modules; y++) {
            for (int x = 0; x < modules; x++) {
                if (!matrix[y][x]) continue;

                float left = (x + quietZone) * cellSize;
                float top = (y + quietZone) * cellSize;
                float right = left + cellSize;
                float bottom = top + cellSize;

                boolean isFinder = (x < 7 && y < 7) || (x >= modules - 7 && y < 7) || (x < 7 && y >= modules - 7);
                if (isFinder || style == STYLE_SQUARE) {
                    canvas.drawRect(left, top, right + 0.4f, bottom + 0.4f, fgPaint);
                } else if (style == STYLE_DOTS) {
                    float cx = (left + right) * 0.5f;
                    float cy = (top + bottom) * 0.5f;
                    canvas.drawCircle(cx, cy, cellSize * 0.44f, fgPaint);
                } else {
                    canvas.save();
                    float cx = (left + right) * 0.5f;
                    float cy = (top + bottom) * 0.5f;
                    canvas.rotate(45f, cx, cy);
                    float r = cellSize * 0.34f;
                    canvas.drawRect(cx - r, cy - r, cx + r, cy + r, fgPaint);
                    canvas.restore();
                }
            }
        }

        // Subtle outer border
        Paint borderPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        borderPaint.setColor(fgColor);
        borderPaint.setAlpha(90);
        borderPaint.setStyle(Paint.Style.STROKE);
        borderPaint.setStrokeWidth(4f);
        canvas.drawRoundRect(new RectF(4, 4, pixelSize - 4, pixelSize - 4), 32f, 32f, borderPaint);

        return bmp;
    }
}
