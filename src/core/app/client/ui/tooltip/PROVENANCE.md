# Tooltip module provenance

`tooltip.ts`, `tooltip.css` and `README.md` in this directory are the accepted H19 tooltip module, carried byte for byte
(no edits) from public `just-every/run-happytohelp` at commit `3710a4b4bf06b83246463c76024917e3ade1870f`,
`src/modules/tooltip/`, read through raw.githubusercontent.com at that exact commit (the source repository was not cloned).

| File | Bytes | SHA-256 |
|---|---|---|
| tooltip.ts | 15892 | eae2c372d0d8d73abea4f817927bba83c68f05c54fa4ef858f4bba711a8e3ea9 |
| tooltip.css | 1650 | c3d6fb51ef434350d10c37a76af5fee8137769513a231e6c4bdd29f54a4fffd9 |
| README.md | 2055 | 54a3a2142220d55000d9e6c3462b590cd9b7528df7a546a924800887e68739f4 |

The module has no product imports. Lamp's integration lives outside these files: `../tooltip-layer.tsx` mounts the layer
once for the operator document, `src/editor/editor-widget.ts` mounts it in the editor launcher's shadow root, and Lamp's
colours and type are set through the documented `--tooltip-*` custom properties in `../tokens.css`.
Base's own copy of this module is a follow-up; this carries the same accepted source, not a parallel implementation.
