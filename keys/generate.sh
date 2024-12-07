ssh-keygen -t rsa -P "" -b 4096 -m PEM -f jwtRS256.key
ssh-keygen -e -m PEM -f jwtRS256.key > jwtRS256.key.pub

# Rename files
mv jwtRS256.key private.pem
mv jwtRS256.key.pub public.pem