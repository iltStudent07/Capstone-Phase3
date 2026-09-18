# Capstone Phase 3

This repo is for demonstrating my knowledge and skills with Node.js, Express, MongoDB, Mongoose, React &amp; TypeScript, Authentication, Docker, SSL/TLS, Kubernetes and Git.

## Architecture Overview

[Architecture Documentation](ARCHITECTURE.md)

## Quick-Start Instructions (Docker Compose)

Use Docker Compose for the fastest way to run the full stack locally. This starts MongoDB, the Express API, and the React client together with the correct internal networking already configured.

### Prerequisites

- Docker Desktop or Docker Engine with Compose support
- Ports `3000`, `4000`, and `27018` available on your machine

### Steps

1. Clone the repository and move into the project root.
2. Start the stack:

   ```bash
   docker compose up --build
   ```

3. Open the app in your browser at `http://localhost:3000`.
4. The API will be available at `http://localhost:4000/api`, and MongoDB will be exposed on `localhost:27018`.

### Notes

- The API uses the built-in development JWT secret and connects to the Mongo container automatically.
- Stop the stack with `Ctrl+C`, or run `docker compose down` from another terminal.

## Local Dev Setup (without Docker)

Run this mode if you want separate frontend and backend processes for development. You will install dependencies locally, run MongoDB yourself, then start the API and Vite client in two terminals.

### Prerequisites

- Node.js 20+
- npm
- A local MongoDB instance, or a MongoDB container listening on port `27018`

### Steps

1. Install dependencies for both apps:

   ```bash
   cd api && npm install
   cd client && npm install
   ```

2. Start MongoDB.

   If you want to use Docker just for the database, from the project root run:

   ```bash
   docker compose up mongo -d
   ```

3. In one terminal, start the API:

   ```bash
   cd api
   MONGODB_URI=mongodb://localhost:27018/policy-claims JWT_SECRET=dev-capstone-secret PORT=4000 npm run dev
   ```

4. In a second terminal, start the client:

   ```bash
   cd client
   npm run dev
   ```

5. Open the app at `http://localhost:5173`.

### Notes

- Vite proxies `/api` requests to `http://localhost:4000`, so the frontend and backend work together during development.
- If your MongoDB runs on a different host or port, update `MONGODB_URI` before starting the API.

## Production Build (with SSL)

The production setup serves the React app through Nginx and exposes both HTTP and HTTPS. SSL is handled with a locally generated self-signed certificate stored in the `certs/` folder.

### Prerequisites

- Docker with Compose support
- OpenSSL
- Ports `8080` and `8443` available

### Steps

1. Generate local certificates from the project root:

   ```bash
   chmod +x generate-certs.sh
   ./generate-certs.sh
   ```

2. Start the production stack:

   ```bash
   docker compose -f docker-compose.prod.yml up --build -d
   ```

3. Open the application:
   - HTTP: `http://localhost:8080`
   - HTTPS: `https://localhost:8443`

4. If your browser warns about the certificate, continue past the warning since the cert is self-signed for local testing.

### Notes

- The client container mounts the generated certificates and uses the SSL Nginx configuration.
- Shut everything down with:

  ```bash
  docker compose -f docker-compose.prod.yml down
  ```

## Kind Deployment

This option runs the application on a local Kubernetes cluster using Kind. Build the images locally, load them into the cluster, apply the manifests, then access the client through the mapped NodePort.

### Prerequisites

- Docker
- `kind`
- `kubectl`

### Steps

1. Create the Kind cluster:

   ```bash
   kind create cluster --name policy-claims --config k8s/kind-config.yaml
   ```

2. Build the application images from the project root:

   ```bash
   docker build -t api:latest ./api
   docker build -t client:latest ./client
   ```

3. Load the images into Kind:

   ```bash
   kind load docker-image api:latest --name policy-claims
   kind load docker-image client:latest --name policy-claims
   ```

4. Apply the Kubernetes manifests:

   ```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/secrets.yaml
   kubectl apply -f k8s/mongo.yaml
   kubectl apply -f k8s/api.yaml
   kubectl apply -f k8s/client.yaml
   ```

5. Wait for the pods to become ready, then open the client at `http://localhost:30080`.

### Useful checks

```bash
kubectl get pods -n policy-claims
kubectl get services -n policy-claims
```

### Cleanup

```bash
kind delete cluster --name policy-claims
```

## API Endpoint Reference Table

Protected routes expect an `Authorization: Bearer <token>` header.

| Method   | Endpoint                | Auth | Request body / query                                                                   | Response summary                                                                                        |
| -------- | ----------------------- | ---- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/health`           | No   | None                                                                                   | Returns `{ status: "ok" }`.                                                                             |
| `POST`   | `/api/auth/register`    | No   | `name`, `email`, `password` and optional `role`                                        | Creates a user and returns a JWT plus basic user info.                                                  |
| `POST`   | `/api/auth/login`       | No   | `email`, `password`                                                                    | Returns a JWT and the authenticated user's profile.                                                     |
| `GET`    | `/api/auth/me`          | Yes  | None                                                                                   | Returns the current authenticated user object.                                                          |
| `GET`    | `/api/dashboard`        | Yes  | None                                                                                   | Returns totals for claims, policies, users, recent claims, claim status counts, and total claim amount. |
| `GET`    | `/api/policies`         | Yes  | Query: `type`, `status`, `search`, `page`, `limit`                                     | Returns paginated policy results in `data` plus a `pagination` object.                                  |
| `GET`    | `/api/policies/:id`     | Yes  | Path param: `id`                                                                       | Returns one policy, including populated owner data.                                                     |
| `POST`   | `/api/policies`         | Yes  | `holderName`, `type`, optional `premium`, `status`, `effectiveDate`, `expriationDate`  | Creates a policy for the logged-in user and auto-generates `policyNumber`.                              |
| `PUT`    | `/api/policies/:id`     | Yes  | Any editable policy fields except `policyNumber`                                       | Updates and returns the matching policy if the user has access.                                         |
| `DELETE` | `/api/policies/:id`     | Yes  | Path param: `id`                                                                       | Deletes a policy and returns a confirmation message.                                                    |
| `GET`    | `/api/claims`           | Yes  | Query: `status`, `policy`, `assignedTo`, `search`, `page`, `limit`                     | Returns paginated claim results in `data` plus `pagination`.                                            |
| `GET`    | `/api/claims/stats`     | Yes  | None                                                                                   | Returns claim counts by status, total claims, and total claim amount.                                   |
| `GET`    | `/api/claims/:id`       | Yes  | Path param: `id`                                                                       | Returns one claim with populated policy, assignee, and note author records.                             |
| `POST`   | `/api/claims`           | Yes  | `policy`, `description`, `incidentDate`, optional `amount`, `status`                   | Creates a claim and assigns it to the authenticated user.                                               |
| `PUT`    | `/api/claims/:id`       | Yes  | Any editable claim fields: `policy`, `description`, `incidentDate`, `amount`, `status` | Updates and returns the claim if the user has access.                                                   |
| `POST`   | `/api/claims/:id/notes` | Yes  | `text`                                                                                 | Adds a note to the claim and returns the updated claim record.                                          |
| `DELETE` | `/api/claims/:id`       | Yes  | Path param: `id`                                                                       | Deletes a claim and returns a confirmation message.                                                     |

## Tech Stack Summary

### MongoDB layer

- MongoDB stores the application's persistent data for users, policies, claims, counters, and embedded claim notes.
- Mongoose models define schema validation, relationships, and hooks.
- The data layer includes generated identifiers like policy numbers and claim numbers through schema middleware and a counter collection.

### Express API layer

- Express provides the REST API under `/api` and organizes endpoints into route modules for auth, policies, claims, and dashboard data.
- `express-validator` handles request validation before controllers run.
- Shared middleware covers JWT authentication, validation error handling, and centralized API error responses.

### React client layer

- React powers the single-page frontend for login, registration, dashboard views, claim management, and policy management.
- `react-router-dom` handles protected routing, nested routes, and page-level navigation.
- The client uses an auth context to keep the logged-in user and token in sync with `localStorage`.

### Node.js runtime layer

- Node.js runs both the API server and the frontend build tooling.
- TypeScript is used across the backend and frontend for stronger typing and better maintainability.
- The API uses libraries such as `jsonwebtoken` for auth, `bcryptjs` for password hashing, and `cors` for cross-origin support.

### Frontend tooling and delivery

- Vite provides the client dev server, fast bundling, and the `/api` proxy used in local development.
- Axios is used for API requests, including automatic JWT header injection and redirect behavior on `401` responses.
- In production, the built React app is served by Nginx, with optional SSL enabled through local certificates.

### Containers and orchestration

- Docker Compose provides a quick way to run MongoDB, the API, and the client together.
- A separate production Compose file adds the SSL-enabled Nginx setup.
- Kubernetes manifests and Kind support local cluster-based deployment for the same multi-service stack.