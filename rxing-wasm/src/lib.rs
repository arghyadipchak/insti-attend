use std::collections::HashSet;

use rxing::{
    BarcodeFormat, BinaryBitmap, DecodeHints, Luma8LuminanceSource, MultiFormatReader, Reader as _,
    common::HybridBinarizer,
};
use wasm_bindgen::{JsValue, prelude::wasm_bindgen};
use web_sys::OffscreenCanvasRenderingContext2d;

const FORMATS: [BarcodeFormat; 2] = [BarcodeFormat::CODE_128, BarcodeFormat::CODE_39];

#[allow(
    clippy::cast_possible_truncation,
    clippy::needless_pass_by_value,
    clippy::similar_names
)]
#[wasm_bindgen(js_name = decodeBarcode)]
/**
Decodes a `CODE_128` or `CODE_39` barcode from an offscreen canvas region.

# Parameters
- `context`: `OffscreenCanvasRenderingContext2d` object containing the barcode image
- `width`: Width of the image region
- `height`: Height of the image region

# Returns
String with the decoded barcode text.

# Errors
Throws an error if the image data cannot be accessed or if no supported barcode is detected.
*/
pub fn decode_barcode(
    context: OffscreenCanvasRenderingContext2d,
    width: u32,
    height: u32,
) -> Result<String, JsValue> {
    let image_data = context.get_image_data(0.0, 0.0, f64::from(width), f64::from(height))?;

    let luma_source = image_data
        .data()
        .chunks_exact(4)
        .map(|pixel| match pixel {
            [_, _, blue, alpha] if *alpha == 0 => 0xFF,
            [red, green, blue, _] => {
                ((306 * u64::from(*red) + 601 * u64::from(*green) + 117 * u64::from(*blue) + 0x200)
                    >> 10) as u8
            }
            _ => 0,
        })
        .collect::<Vec<_>>();

    let luma8_source = match Luma8LuminanceSource::new(luma_source, width, height) {
        Ok(source) => source,
        Err(e) => return Err(JsValue::from_str(&e.to_string())),
    };

    let hints = DecodeHints {
        PossibleFormats: Some(HashSet::from(FORMATS)),
        TryHarder: Some(true),
        ..Default::default()
    };

    match MultiFormatReader::default().decode_with_hints(
        &mut BinaryBitmap::new(HybridBinarizer::new(luma8_source)),
        &hints,
    ) {
        Ok(result) => Ok(result.getText().to_string()),
        Err(e) => Err(JsValue::from_str(&e.to_string())),
    }
}
