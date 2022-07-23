## 0.1

Initial release that allows @inline<Document> instead of just @<Document> to put one field from the referenced object inline in the current text (immediately AFTER the link).

- A referenced object with a single paragraph will be placed inline (as a <span>).
- A referenced object with more than just a single paragraph will be displayed as a separate block (as a <div>).