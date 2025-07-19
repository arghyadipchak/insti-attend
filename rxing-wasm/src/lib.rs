use rxing::{BarcodeFormat, helpers};
use wasm_bindgen::prelude::wasm_bindgen;
use web_sys::OffscreenCanvasRenderingContext2d;

#[inline]
fn convert_image_to_luma(data: &[u8]) -> Vec<u8> {
    let mut luma_data = Vec::with_capacity(data.len() / 4);
    for src_pixel in data.chunks_exact(4) {
        let [red, green, blue, alpha] = src_pixel else {
            continue;
        };
        let pixel = if *alpha == 0 {
            // white, so we know its luminance is 255
            0xFF
        } else {
            // .299R + 0.587G + 0.114B (YUV/YIQ for PAL and NTSC),
            // (306*R) >> 10 is approximately equal to R*0.299, and so on.
            // 0x200 >> 10 is 0.5, it implements rounding.

            ((306 * (*red as u64) + 601 * (*green as u64) + 117 * (*blue as u64) + 0x200) >> 10)
                as u8
        };
        luma_data.push(pixel);
    }

    luma_data
}

#[wasm_bindgen]
/// Decode a barcode from an `OffscreenCanvasRenderingContext2d` object
pub fn decode_barcode(
    canvas: OffscreenCanvasRenderingContext2d,
    width: u32,
    height: u32,
) -> String {
    if let Ok(image_data) = canvas.get_image_data(0.0, 0.0, width as f64, height as f64)
        && let Ok(result) = helpers::detect_in_luma(
            convert_image_to_luma(&image_data.data()),
            width,
            height,
            Some(BarcodeFormat::CODE_128),
        )
    {
        result.getText().to_string()
    } else {
        String::new()
    }
}
