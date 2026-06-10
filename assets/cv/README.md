# Chenxi Han CV

This directory contains the English academic CV source for Chenxi Han.

The layout is adapted from [billryan/resume](https://github.com/billryan/resume), an MIT-licensed LaTeX resume template compiled with XeLaTeX. The copied template license is kept in `LICENSE.billryan-resume`.

## Build

```bash
make
```

The default Makefile target uses `tectonic`, which is convenient for local builds because it downloads missing LaTeX packages automatically. If a full TeX Live installation with XeLaTeX is available, use:

```bash
make xelatex
```

The generated PDF should be committed as `chenxi_han_cv.pdf` so GitHub Pages can serve it directly.
