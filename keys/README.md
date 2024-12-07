## How to generate public & private key

> ⚠️ Don't skip the renaming step.

```bash
./generate.sh
```

**Manual:**
```bash
ssh-keygen -t rsa -P "" -b 4096 -m PEM -f jwtRS256.key
ssh-keygen -e -m PEM -f jwtRS256.key > jwtRS256.key.pub

# Rename files
mv jwtRS256.key private.pem
mv jwtRS256.key.pub public.pem
```