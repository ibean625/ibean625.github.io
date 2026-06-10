SRC = chenxi_han_cv.tex
PDF = chenxi_han_cv.pdf
TEX = tectonic

.PHONY: all xelatex clean

all: $(PDF)

$(PDF): $(SRC) resume.cls
	$(TEX) -X compile $(SRC)

xelatex: $(SRC) resume.cls
	xelatex $(SRC)

clean:
	rm -f *.aux *.log *.out *.toc *.lof *.idx *.ilg *.ind *.synctex.gz
