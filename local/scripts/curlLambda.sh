echo 'curling serverless-pdf-filler, see tmp folder for output json'
echo test.pdf 
curl http://localhost:3009/2015-03-31/functions/serverless-pdf-filler-local/invocations -s -d '{"template":"test.pdf","formValues":{"single":"123.00","multiple":"456.00"}}' > tmp/out_test.json
