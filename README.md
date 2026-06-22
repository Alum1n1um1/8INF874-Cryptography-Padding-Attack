# 8INF874 - Cryptography: Padding Oracle Attack

Ce projet est une démonstration éducative de l'attaque par oracle de remplissage (Padding Oracle Attack) sur le chiffrement AES en mode CBC.
Le projet a été réalisé par BELLENGE Celian et FOUSSET Martial.

## Comment lancer l'application

Prérequis : Vous devez avoir **Docker** et **Docker Compose** installés sur votre machine.

1. Ouvrez le dossier du projet dans votre terminal.
2. Exécutez la commande suivante pour construire et démarrer les conteneurs :
   ```bash
   docker-compose up --build
   ```
   *(Si vous utilisez une version récente de Docker, la commande peut être `docker compose up --build`)*

3. Une fois les conteneurs démarrés, vous pouvez accéder aux différentes interfaces via votre navigateur :
   - **Serveur vulnérable (Interface web de la victime)** : [http://localhost:8080](http://localhost:8080)
   - **Machine de l'attaquant (Interface de l'attaque)** : [http://localhost:8081](http://localhost:8081)
   - *API vulnérable (Backend)* : accessible sur le port `5001` en interne.

Pour arrêter l'application, utilisez `Ctrl+C` dans le terminal où s'exécute Docker Compose, ou exécutez la commande suivante :
```bash
docker-compose down
```

## Comment ça fonctionne

L'application simule un environnement vulnérable à une attaque de *Padding Oracle*. Elle est composée de 3 services principaux qui communiquent ensemble :

1. **Le Serveur Backend (`server-back`)** :
   - C'est l'API vulnérable développée en Python (Flask) qui chiffre et déchiffre des messages en utilisant l'algorithme AES en mode CBC.
   - Il agit comme un **oracle** car il renvoie des codes HTTP ou des erreurs différentes selon si le déchiffrement a échoué à cause d'un *padding* (remplissage) invalide ou d'un message incorrect. Cette différence de comportement permet à un attaquant de déduire progressivement le texte clair.

2. **Le Serveur Frontend (`server-front`)** :
   - Représente la machine de la victime.
   - Fournit une interface utilisateur simple (HTML/CSS/JS) permettant d'interagir avec le backend vulnérable de manière légitime.

3. **L'Interface de l'Attaquant (`attacker`)** :
   - Représente la machine de l'attaquant.
   - Fournit une interface web avec un script (`attaque.js`) conçu pour exploiter la vulnérabilité du backend.
   - L'attaque consiste à intercepter un message chiffré, puis à forger et envoyer des milliers de requêtes modifiées au backend. En observant simplement si le serveur accepte ou rejette le *padding*, le script est capable de retrouver l'intégralité du texte en clair, octet par octet, sans jamais posséder la clé de chiffrement.

## Structure du projet

- `server/back/` : Code de l'API backend vulnérable.
- `server/front/` : Interface utilisateur légitime servie par un serveur web (Nginx/Apache).
- `attacker/` : Interface et scripts malveillants pour réaliser l'attaque de Padding Oracle.
- `docker-compose.yml` : Fichier d'orchestration pour lancer les trois services facilement.
