
VPATH = ./lib/:./:./bin:./src:./build:./commands
DOC_PARSER_SRC = parser/doc-syntax.pegjs 
DOC_PARSER = ./commands/doc-syntax.mjs
TRACE = 
PEG = /usr/local/bin/pegjs $(TRACE) --cache --format es --optimize speed --output $@ $<

.PHONY:all
all: doc-parser

# Parserのビルド

.PHONY:doc-parser
doc-parser: $(DOC_PARSER)

$(DOC_PARSER): $(DOC_PARSER_SRC)
	$(PEG)

.PHONY: test-parser
test-parser: doc-parser
	node --experimental-modules ./tests/parser/markdown-test.mjs
	ava ./tests/**/*.test.mjs

.PHONY:clean
clean:; rm $(DOC_PARSER)

.PHONY:trace
trace: TRACE = --trace
trace: doc-parser

