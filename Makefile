
local-pdf-service:
	yarn run start

local-run:
	make local-bucket-populate && make local-lambda-curl && make generate-pdf-from-output

up:
	docker-compose up -d

all-docker:
	make up && make local-bucket-populate && make local-lambda-curl && make generate-pdf-from-output

layer-pdflib:
	./local/scripts/build-pdflib.sh

layer-qpdf:
	./local/scripts/build-qpdf.sh

local-bucket-populate:
	./local/scripts/putObjects.sh

local-lambda-curl:
	./local/scripts/curlLambda.sh

generate-pdf-from-output:
	mkdir out && \
	cat tmp/out_test.json | jq .body -r | base64 -d > out/final_test.pdf