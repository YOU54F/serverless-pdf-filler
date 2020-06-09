
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

layer-qpdf-zip:
	cd layer/qpdf_orig && zip -9r qpdf-layer.zip ./bin ./lib && mv qpdf-layer.zip ../

local-bucket-populate:
	./local/scripts/putObjects.sh

local-lambda-curl:
	./local/scripts/curlLambda.sh

invoke-deployed:
	./local/scripts/invokeDeployed.sh

generate-pdf-from-output:
	mkdir out && \
	cat tmp/out_interest-free-unreg.json | jq .body -r | base64 -d > out/final_interest-free-unreg.pdf & \
	cat tmp/out_interest-free-reg.json | jq .body -r | base64 -d > out/final_interest-free-reg.pdf & \
	cat tmp/out_unreg_unassisted_March_20.json | jq .body -r | base64 -d > out/final_unreg_unassisted_March_20.pdf & \
	cat tmp/out_bnpl-reg-fee.json | jq .body -r | base64 -d > out/final_bnpl-reg-fee.pdf & \
	cat tmp/out_bnpl-reg-no-fee.json | jq .body -r | base64 -d > out/final_bnpl-reg-no-fee.pdf & \
	cat tmp/out_cdibc-reg-fee.json | jq .body -r | base64 -d > out/final_cdibc-reg-fee.pdf & \
	cat tmp/out_cdibc-reg-no-fee.json | jq .body -r | base64 -d > out/final_cdibc-reg-no-fee.pdf & \
	cat tmp/out_cdifc-reg-no-fee.json | jq .body -r | base64 -d > out/final_cdifc-reg-no-fee.pdf & \
	cat tmp/out_ibc-reg.json | jq .body -r | base64 -d > out/final_ibc-reg.pdf