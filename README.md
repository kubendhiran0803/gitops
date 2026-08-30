# GitOps Demo Project

Welcome to the GitOps Demo project! This repository contains a full-stack demonstration of deploying a Node.js application and a MySQL database to Kubernetes, intended to be managed via GitOps principles (e.g., using ArgoCD).

> [!IMPORTANT]
> **Handover Notes for Engineering Team (Deadline: Monday Morning)**
> Please review the "Status & Handover" section below to see the current progress on the assignment and the next steps required to complete the setup.

## My Current Stage

Based on the assignment requirements, here is what I have completed so far:

### 1. ✅ Deploy an application with a MySQL database
- **Requirement:** Store the MySQL credentials securely using a Kubernetes Secret and configure the application to connect to the database.
- **Status:** **Completed.** 
  - I created [`mysql-secret.yaml`](./k8s/mysql-secret.yaml) to securely hold the MySQL credentials.
  - The [`mysql.yaml`](./k8s/mysql.yaml) deployment uses this secret.
  - The [`app.yaml`](./k8s/app.yaml) deployment is successfully configured to pull these credentials as environment variables so the Node.js app can connect to the database.

### 2. ✅ Implement a Kubernetes NetworkPolicy
- **Requirement:** Prevent Pod 1 from communicating with Pod 2, while allowing the required traffic between other pods.
- **Status:** **Completed.** 
  - I implemented the policy in [`network-policy.yaml`](./k8s/network-policy.yaml). It specifically targets `pod-2` and explicitly denies any incoming traffic from `pod-1`.

---

## What I Will Do Next (Pending Tasks)

To finish the assignment by Monday morning, I (or the next engineer taking over) need to complete the final requirement:

### 3. ⏳ Deploy Argo CD & Configure GitOps Workflow
- **Requirement:** Deploy Argo CD and configure a GitOps workflow where an application is automatically deployed or updated in the Kubernetes cluster whenever new code is committed to the Git repository.
- **Action Plan:**
  1. **Install Argo CD:** I will install Argo CD on my Kubernetes cluster by running the official installation manifests (e.g., `kubectl create namespace argocd` and applying the install YAML).
  2. **Create the Application Manifest:** I will author an Argo CD `Application` custom resource YAML in the [`argocd/`](./argocd) directory. This manifest will point to this Git repository and specify the `k8s/` directory as the target path.
  3. **Apply the Manifest:** I will run `kubectl apply -f argocd/application.yaml`. This will tell Argo CD to start watching this repository. Any new code or config changes committed will then be automatically deployed to the cluster, completing the GitOps workflow!

---

## Project Structure

Here is a breakdown of the repository structure:

- **`app/`**: Contains the source code for the Node.js web application.
  - [`server.js`](./app/server.js): An Express backend that connects to a MySQL database, initializes a `messages` table, and serves an API endpoint (`/`) that returns the connection status and message count. It also includes a `/health` check endpoint.
  - [`package.json`](./app/package.json): Defines the Node.js dependencies (`express` and `mysql2`).
  - [`Dockerfile`](./app/Dockerfile): Used to build the Docker image (`gitops-demo-app:v2`) for the application.

- **`k8s/`**: Contains the Kubernetes manifests to deploy the infrastructure and application.
  - [`namespace.yaml`](./k8s/namespace.yaml): Defines the `gitops-demo` namespace where all resources are created.
  - [`mysql-secret.yaml`](./k8s/mysql-secret.yaml): Stores the database credentials securely.
  - [`mysql.yaml`](./k8s/mysql.yaml): Deploys the MySQL 8.0 database (Deployment and ClusterIP Service).
  - [`app.yaml`](./k8s/app.yaml): Deploys the Node.js application (Deployment with 2 replicas and a ClusterIP Service). It reads database credentials from `mysql-secret`.
  - [`network-policy.yaml`](./k8s/network-policy.yaml): A NetworkPolicy demonstration that explicitly restricts traffic, denying ingress from `pod-1` to `pod-2`.
  - [`pod-1.yaml`](./k8s/pod-1.yaml) & [`pod-2.yaml`](./k8s/pod-2.yaml): Dummy pods used for testing the above network policy.

- **`argocd/`**: A directory intended to store ArgoCD `Application` manifests that sync this repository with your Kubernetes cluster.
