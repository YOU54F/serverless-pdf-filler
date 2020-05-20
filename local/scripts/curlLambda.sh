echo 'curling serverless-pdf-filler, see tmp folder for output json'
echo interest-free-unreg.pdf 
curl http://localhost:3009/2015-03-31/functions/serverless-pdf-filler-local/invocations -s -d '{"template":"test.pdf","formValues":{"single":"123.00"}}' > tmp/out_test.json
