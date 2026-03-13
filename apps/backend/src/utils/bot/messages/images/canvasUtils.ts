import { type Canvas } from "@napi-rs/canvas";


/** Scales canvas text down until it fits within the canvas width.
 * @right-offset 300 (i think) */
export const applyCanvasText = (canvas: Canvas, text: string) => {
    const context = canvas.getContext('2d');

    // Declare a base size of the font
    let fontSize = 70;

    do {
        // Assign the font to the context and decrement it so it can be measured again
        context.font = `${(fontSize -= 10)}px sans-serif`;
        // Compare pixel width of the text to the canvas minus the approximate avatar size
    } while (context.measureText(text).width > canvas.width - 150);

    // Return the result to use in the actual canvas
    return context.font;
};