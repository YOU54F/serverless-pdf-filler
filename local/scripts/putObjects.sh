export AWS_ACCESS_KEY_ID=S3RVER
export AWS_SECRET_ACCESS_KEY=S3RVER
aws --endpoint http://localhost:4569 s3api create-bucket --bucket pdf-templates-local
aws --endpoint http://localhost:4569 s3api put-object --bucket pdf-templates-local --key test.pdf --body pdf-templates/test.pdf
