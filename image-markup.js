export function imageMarkup(images, key, alt, eager) {
  const image = images[key] || {};
  return '<img src="' + (image.uri || "") + '" alt="' + String(alt || "").replace(/"/g, "&quot;") + '"'
    + (image.w ? ' width="' + image.w + '" height="' + image.h + '"' : "")
    + ' loading="' + (eager ? "eager" : "lazy") + '" decoding="async">';
}
