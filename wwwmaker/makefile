
VPATH = ./lib/:./:./bin
DOC_PARSER_SRC = ./src/parser/doc-syntax.pegjs
DOC_PARSER = ./commands/doc-syntax.mjs
PEG = /usr/local/bin/pegjs --trace --cache --format es --optimize speed --output $@ $<

.PHONY:all
all: test-parser

# Parserのビルド

.PHONY:doc-parser
doc-parser: $(DOC_PARSER)

$(DOC_PARSER): $(DOC_PARSER_SRC)
	$(PEG)

.PHONY: test-parser
test-parser: $(DOC_PARSER)
	node --experimental-modules ./tests/test-markdown.mjs

.PHONY:clean
clean:; rm $(DOC_PARSER)


