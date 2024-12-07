curl https://eloheaven.gg/api/v1/webhooks/docker/kick-sockets && 
sleep 5 &&
sudo docker-compose up --build -d --force-recreate --no-deps
