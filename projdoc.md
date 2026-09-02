# ArgoCD GitOps Workflow: Under the Hood

This document explains the step-by-step workflow of how ArgoCD manages application deployments, specifically detailing what happens when a change is made in a Git repository (like changing replicas from 3 to 5) and the roles of various ArgoCD components (pods) in this process.

## The ArgoCD Components (Pods) and Their Roles

ArgoCD is composed of several microservices running as pods in your Kubernetes cluster. Here is what each one does:

1. **argocd-server (ArgoCD API Server):**
   - **Role:** This is the brain for user interactions. It provides the Web UI, CLI API, and handles authentication/authorization.
   - **Action:** When you click the "Sync" button in the UI, this pod receives your request.

2. **argocd-repo-server (Repository Server):**
   - **Role:** This pod is responsible for communicating with your Git repositories (like GitHub).
   - **Action:** It clones your repositories, caches them, and generates the Kubernetes manifests (Desired State) from your Helm charts, Kustomize, or plain YAML files.

3. **argocd-application-controller (Application Controller):**
   - **Role:** The core engine of ArgoCD. It continuously monitors running applications and compares their actual live state against the desired target state specified in Git.
   - **Action:** It detects `OutOfSync` conditions and is the component that actually talks to the Kubernetes API server to apply changes.

4. **argocd-redis (Redis Cache):**
   - **Role:** Provides caching for the repo-server and application-controller to improve performance and avoid hitting Git or the K8s API too frequently.

5. **argocd-dex-server (Dex - Optional but common):**
   - **Role:** Handles Single Sign-On (SSO) integrations (e.g., connecting ArgoCD to GitHub, Google, or Active Directory).

---

## Step-by-Step Workflow: Changing Replicas from 3 to 5

Here is the exact flow of data and commands when you update your code and hit "Sync".

### Phase 1: Git Update and Detection (Out of Sync)

1. **You Commit Code:** You push a commit to your GitHub repository changing `replicas: 3` to `replicas: 5` in a Deployment YAML file.
2. **Repo Server Generates Manifests:** The **argocd-repo-server** fetches the latest commit from GitHub and generates the new Kubernetes manifests (Desired State).
3. **Controller Compares States:** The **argocd-application-controller** regularly polls the repo-server for the desired state, and polls the Kubernetes API server for the actual live state.
4. **Out of Sync Detected:** The application-controller notices a discrepancy: Git says 5 replicas, but the Kubernetes cluster only has 3. It marks the ArgoCD Application as **OutOfSync**.

### Phase 2: User Clicks "Sync"

5. **Sync Request:** You open the ArgoCD UI and click the "Sync" button.
6. **API Server Receives Request:** The **argocd-server** pod receives your click (API request). It validates your permissions.
7. **Instruction to Controller:** The argocd-server tells the **argocd-application-controller** to execute a sync operation for that specific application.

### Phase 3: Applying to Kubernetes (Etcd & API Server)

8. **Controller Applies Changes:** The **argocd-application-controller** acts like an automated `kubectl apply`. It sends a `PUT` or `PATCH` request to the **Kubernetes API Server**, telling it: *"Update this Deployment object to have 5 replicas."*
9. **API Server Updates Etcd:** The Kubernetes API Server receives this request. It validates it, and then writes this new configuration directly into the **Etcd database** (the central nervous system and storage of Kubernetes).

### Phase 4: Kubernetes Takes Over (The Application Runs)

Now that Etcd has the new desired state, ArgoCD's main job is done. Native Kubernetes controllers take over:

10. **Deployment/ReplicaSet Controller Reacts:** The built-in Kubernetes ReplicaSet Controller (running in the `kube-controller-manager` pod) constantly watches Etcd (via the API server). It sees that the desired replicas are now 5, but only 3 pods exist.
11. **Creating New Pods:** The ReplicaSet Controller tells the API server to create 2 brand new Pod objects.
12. **Scheduling:** The `kube-scheduler` notices 2 new pods without assigned nodes and assigns them to available worker nodes.
13. **Kubelet Starts Containers:** The `kubelet` agent on those specific worker nodes sees the new pod assignments and talks to the container runtime (e.g., containerd, Docker) to pull the image and start the actual application containers.
14. **Synced Status:** Meanwhile, the **argocd-application-controller** is still watching. It sees the new pods spinning up. Once the 5 pods are running and ready, it marks the ArgoCD Application status as **Synced** and **Healthy**.

## Summary answering your specific questions:

- **Who tells the API-server when you click Sync?**
  You click Sync -> `argocd-server` receives it -> tells `argocd-application-controller` -> `argocd-application-controller` tells the **Kubernetes API-server**.
- **Who stores it on the Etcd database?**
  The **Kubernetes API-server** is the *only* component allowed to talk to Etcd. The ArgoCD application-controller sends the request to the API-server, and the API-server writes it to Etcd.
- **How is the application running in the cluster?**
  ArgoCD doesn't run your application; Kubernetes does. ArgoCD simply updates the blueprint (in Etcd). Native Kubernetes components (`kube-controller-manager`, `kube-scheduler`, and `kubelet`) do the actual heavy lifting of spinning up the pods based on that blueprint.
