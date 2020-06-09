echo 'invoking serverless-pdf-filler, see tmp folder for output json'
echo test.pdf 
sls invoke --stage yousaftest -f generate-pdf -d '{"template":"test.pdf","formValues":{"single":"123.00","multiple":"456.00"}}' > tmp/out_test.json