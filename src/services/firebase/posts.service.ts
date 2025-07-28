import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  increment,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { FirebasePost } from '../../types/firebase';
import type { Post } from '../../types';

class FirebasePostsService {
  private readonly collectionName = 'posts';

  // Create comprehensive sample posts for world-class appearance
  private getSamplePosts(): Omit<FirebasePost, 'id'>[] {
    return [
      {
        title: "Building Scalable Microservices Architecture: A Complete Guide",
        slug: "building-scalable-microservices-architecture-complete-guide",
        excerpt: "Learn how to design, implement, and scale microservices architecture for enterprise applications. This comprehensive guide covers service decomposition, API design, data management, and deployment strategies.",
        content: `# Building Scalable Microservices Architecture: A Complete Guide

## Introduction

Microservices architecture has revolutionized how we build and scale modern applications. In this comprehensive guide, we'll explore the principles, patterns, and best practices for designing robust microservices systems.

## Why Microservices?

Traditional monolithic applications face several challenges as they grow:
- **Scalability bottlenecks**: Single points of failure
- **Technology lock-in**: Difficult to adopt new technologies
- **Team coordination**: Large teams working on the same codebase
- **Deployment complexity**: One bug can bring down the entire system

## Core Principles

### 1. Single Responsibility
Each microservice should have a single, well-defined business responsibility.

### 2. Decentralized Data Management
Each service manages its own data store, following the database-per-service pattern.

### 3. Failure Isolation
Services should be designed to handle failures gracefully without cascading effects.

## Service Decomposition Strategies

### Domain-Driven Design (DDD)
- Identify bounded contexts
- Define aggregates and entities
- Establish clear service boundaries

### Data-Driven Decomposition
- Analyze data relationships
- Minimize cross-service transactions
- Ensure data consistency

## Implementation Best Practices

### API Design
- Use RESTful principles
- Implement proper versioning
- Document with OpenAPI/Swagger

### Communication Patterns
- Synchronous: HTTP/REST, gRPC
- Asynchronous: Message queues, Event streaming

### Data Management
- Event sourcing for audit trails
- CQRS for read/write optimization
- Saga pattern for distributed transactions

## Technology Stack Recommendations

### Service Mesh
- **Istio**: Advanced traffic management
- **Linkerd**: Lightweight service mesh
- **Consul Connect**: HashiCorp ecosystem

### Container Orchestration
- **Kubernetes**: Industry standard
- **Docker Swarm**: Simpler alternative
- **AWS ECS**: Managed container service

### Monitoring & Observability
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **Jaeger**: Distributed tracing
- **ELK Stack**: Log aggregation

## Conclusion

Microservices architecture provides significant benefits for scalable, maintainable systems. However, it also introduces complexity that must be carefully managed. Start small, iterate, and scale gradually.`,
        author_id: "akshay_verma",
        author_name: "Akshay Verma",
        author_image: "/images/akshay.png",
        featured_image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
        tags: ["microservices", "architecture", "scalability", "enterprise", "design-patterns"],
        categories: ["Architecture", "Backend"],
        status: "published" as const,
        featured: true,
        views: 15420,
        likes: 342,
        reading_time: 12,
        seo_meta: {
          meta_title: "Building Scalable Microservices Architecture: Complete 2024 Guide",
          meta_description: "Master microservices architecture with this comprehensive guide. Learn service decomposition, API design, data management, and deployment strategies for enterprise applications.",
          canonical_url: "https://carelwave.com/blog/building-scalable-microservices-architecture-complete-guide",
          og_image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200"
        },
        created_at: Timestamp.fromDate(new Date('2024-01-15')),
        updated_at: Timestamp.fromDate(new Date('2024-01-15')),
        published_at: Timestamp.fromDate(new Date('2024-01-15'))
      },
      {
        title: "AWS Cloud Migration Strategy: From On-Premises to Cloud-Native",
        slug: "aws-cloud-migration-strategy-on-premises-to-cloud-native",
        excerpt: "A strategic approach to migrating enterprise workloads to AWS. Learn about the 6 R's of migration, cost optimization, security considerations, and best practices for a successful cloud transformation.",
        content: `# AWS Cloud Migration Strategy: From On-Premises to Cloud-Native

## Executive Summary

Cloud migration is no longer a question of "if" but "when" and "how." This guide provides a comprehensive strategy for migrating enterprise workloads to AWS, covering planning, execution, and optimization phases.

## The Business Case for Cloud Migration

### Cost Benefits
- **CapEx to OpEx**: Convert capital expenditure to operational expenditure
- **Resource Optimization**: Pay only for what you use
- **Reduced Maintenance**: Eliminate hardware maintenance costs

### Operational Benefits
- **Scalability**: Scale resources on-demand
- **Reliability**: 99.99% SLA guarantees
- **Global Reach**: Deploy in multiple regions instantly

## Migration Strategies: The 6 R's

### 1. Rehost (Lift and Shift)
Quick migration with minimal changes. Ideal for:
- Legacy applications
- Tight migration timelines
- Initial cloud experience

### 2. Replatform (Lift, Tinker, and Shift)
Minor optimizations during migration:
- Database migration (RDS)
- Load balancer replacement (ALB)
- Container adoption (ECS/EKS)

### 3. Refactor/Re-architect
Complete application redesign:
- Microservices architecture
- Serverless functions (Lambda)
- Cloud-native services

### 4. Repurchase
Replace with SaaS solutions:
- CRM systems (Salesforce)
- ERP systems (SAP on AWS)
- Email systems (Office 365)

### 5. Retire
Decommission unused applications:
- Identify redundant systems
- Sunset legacy applications
- Reduce licensing costs

### 6. Retain
Keep on-premises for now:
- Compliance requirements
- High-performance computing
- Recently upgraded systems

## Migration Planning Framework

### Phase 1: Assessment and Planning
1. **Portfolio Discovery**
   - Application inventory
   - Dependency mapping
   - Performance baseline

2. **Business Case Development**
   - TCO analysis
   - ROI projections
   - Risk assessment

3. **Migration Strategy**
   - Prioritization matrix
   - Wave planning
   - Timeline development

### Phase 2: Foundation Setup
1. **Account Strategy**
   - Multi-account setup
   - AWS Organizations
   - Control Tower implementation

2. **Network Design**
   - VPC architecture
   - Hybrid connectivity
   - Security groups

3. **Security Framework**
   - IAM strategy
   - Data encryption
   - Compliance controls

### Phase 3: Migration Execution
1. **Pilot Migration**
   - Low-risk applications
   - Proof of concept
   - Team training

2. **Wave Migrations**
   - Batch processing
   - Rollback planning
   - Performance monitoring

3. **Validation & Testing**
   - Functional testing
   - Performance testing
   - Security validation

## AWS Migration Tools

### Discovery Tools
- **AWS Application Discovery Service**: Automated discovery
- **AWS Migration Hub**: Centralized tracking
- **CloudEndure Migration**: Live migration

### Migration Tools
- **AWS Database Migration Service**: Database migration
- **AWS Server Migration Service**: Server migration
- **AWS DataSync**: Data transfer

### Assessment Tools
- **AWS Migration Evaluator**: TCO calculator
- **AWS Well-Architected Tool**: Architecture review
- **AWS Trusted Advisor**: Best practice recommendations

## Security Considerations

### Data Protection
- Encryption in transit and at rest
- Key management (AWS KMS)
- Data classification and handling

### Identity and Access Management
- Principle of least privilege
- Multi-factor authentication
- Regular access reviews

### Compliance
- SOC 2, ISO 27001, PCI DSS
- GDPR, HIPAA compliance
- Audit trail maintenance

## Cost Optimization Strategies

### Right-Sizing
- Instance type optimization
- Auto-scaling implementation
- Scheduled scaling

### Reserved Instances
- 1-year and 3-year commitments
- Convertible vs. standard
- Payment options

### Storage Optimization
- S3 storage classes
- EBS volume types
- Data lifecycle policies

## Post-Migration Optimization

### Performance Monitoring
- CloudWatch metrics
- X-Ray tracing
- Custom dashboards

### Cost Monitoring
- Cost Explorer
- Budgets and alerts
- Usage reports

### Continuous Improvement
- Regular architecture reviews
- Performance optimization
- Security posture assessment

## Common Pitfalls and Solutions

### Challenge: Unexpected Costs
**Solution**: Implement comprehensive monitoring and budgeting

### Challenge: Performance Issues
**Solution**: Proper load testing and performance optimization

### Challenge: Security Gaps
**Solution**: Security-first approach with regular audits

## Conclusion

Successful AWS migration requires careful planning, execution, and ongoing optimization. Start with a clear strategy, leverage AWS tools and services, and maintain focus on security and cost optimization throughout the journey.

The cloud-native future awaits - take the first step today.`,
        author_id: "akshay_verma",
        author_name: "Akshay Verma",
        author_image: "/images/akshay.png",
        featured_image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
        tags: ["aws", "cloud-migration", "enterprise", "devops", "infrastructure"],
        categories: ["Cloud", "DevOps"],
        status: "published" as const,
        featured: true,
        views: 12830,
        likes: 287,
        reading_time: 15,
        seo_meta: {
          meta_title: "AWS Cloud Migration Strategy: Complete Enterprise Guide 2024",
          meta_description: "Master AWS cloud migration with this comprehensive enterprise guide. Learn the 6 R's of migration, cost optimization, security, and best practices for successful cloud transformation.",
          canonical_url: "https://carelwave.com/blog/aws-cloud-migration-strategy-on-premises-to-cloud-native",
          og_image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200"
        },
        created_at: Timestamp.fromDate(new Date('2024-01-20')),
        updated_at: Timestamp.fromDate(new Date('2024-01-20')),
        published_at: Timestamp.fromDate(new Date('2024-01-20'))
      },
      {
        title: "Golang Performance Optimization: Advanced Techniques for High-Scale Applications",
        slug: "golang-performance-optimization-advanced-techniques",
        excerpt: "Discover advanced Go optimization techniques for building high-performance applications. Learn about memory management, concurrency patterns, profiling, and benchmarking strategies.",
        content: `# Golang Performance Optimization: Advanced Techniques for High-Scale Applications

## Introduction

Go's simplicity and performance make it ideal for high-scale applications. However, achieving optimal performance requires understanding Go's runtime, memory model, and concurrency primitives. This guide explores advanced optimization techniques for building lightning-fast Go applications.

## Memory Management Optimization

### Understanding Go's Memory Model
Go uses a garbage collector that can impact performance if not properly managed. Key concepts:

- **Stack vs. Heap allocation**
- **Escape analysis**
- **GC tuning parameters**

### Memory Pool Patterns
\`\`\`go
// Object pooling for frequent allocations
var bufferPool = sync.Pool{
    New: func() interface{} {
        return make([]byte, 1024)
    },
}

func processData(data []byte) {
    buf := bufferPool.Get().([]byte)
    defer bufferPool.Put(buf)
    
    // Process data using pooled buffer
}
\`\`\`

### String Optimization
\`\`\`go
// Avoid string concatenation in loops
var builder strings.Builder
builder.Grow(expectedSize) // Pre-allocate capacity
for _, item := range items {
    builder.WriteString(item)
}
result := builder.String()
\`\`\`

## Concurrency Optimization

### Worker Pool Pattern
\`\`\`go
type WorkerPool struct {
    tasks   chan Task
    workers int
}

func (p *WorkerPool) Start() {
    for i := 0; i < p.workers; i++ {
        go func() {
            for task := range p.tasks {
                task.Execute()
            }
        }()
    }
}
\`\`\`

### Channel Optimization
- **Buffered channels** for reducing blocking
- **Fan-out/fan-in** patterns for parallel processing
- **Pipeline patterns** for stream processing

### Context Usage
\`\`\`go
func processWithTimeout(ctx context.Context, data []byte) error {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()
    
    return processData(ctx, data)
}
\`\`\`

## CPU Optimization Techniques

### Algorithm Optimization
- Choose appropriate data structures
- Implement efficient algorithms
- Use bit manipulation where applicable

### Compiler Optimizations
\`\`\`go
// Use build constraints for platform-specific optimizations
//go:build amd64
// +build amd64

func optimizedFunction() {
    // AMD64-specific implementation
}
\`\`\`

### Assembly Integration
For critical hot paths, consider assembly:
\`\`\`go
//go:noescape
func fastHash(data []byte) uint64
\`\`\`

## I/O Optimization

### Network Optimization
\`\`\`go
// Connection pooling
var httpClient = &http.Client{
    Transport: &http.Transport{
        MaxIdleConns:        100,
        MaxIdleConnsPerHost: 100,
        IdleConnTimeout:     90 * time.Second,
    },
}
\`\`\`

### File I/O Optimization
\`\`\`go
// Buffered I/O for better performance
file, err := os.Open("large-file.txt")
if err != nil {
    return err
}
defer file.Close()

scanner := bufio.NewScanner(file)
scanner.Buffer(make([]byte, 64*1024), 1024*1024) // 64KB buffer, 1MB max
\`\`\`

## Profiling and Benchmarking

### CPU Profiling
\`\`\`go
import _ "net/http/pprof"

func main() {
    go func() {
        log.Println(http.ListenAndServe("localhost:6060", nil))
    }()
    
    // Your application code
}
\`\`\`

### Memory Profiling
\`\`\`bash
go tool pprof http://localhost:6060/debug/pprof/heap
\`\`\`

### Benchmarking Best Practices
\`\`\`go
func BenchmarkFunction(b *testing.B) {
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        functionToTest()
    }
}
\`\`\`

## Advanced Patterns

### Lock-Free Programming
\`\`\`go
import "sync/atomic"

type Counter struct {
    value int64
}

func (c *Counter) Increment() {
    atomic.AddInt64(&c.value, 1)
}

func (c *Counter) Value() int64 {
    return atomic.LoadInt64(&c.value)
}
\`\`\`

### Cache-Friendly Data Structures
- Minimize memory allocations
- Use cache-aligned structures
- Implement data locality principles

## Production Optimization

### Build Optimization
\`\`\`bash
# Production build flags
go build -ldflags="-s -w" -gcflags="-B" main.go
\`\`\`

### Runtime Tuning
\`\`\`bash
# Environment variables for runtime tuning
export GOGC=100
export GOMAXPROCS=8
export GOMEMLIMIT=8GB
\`\`\`

### Monitoring and Observability
- Implement metrics collection
- Use distributed tracing
- Monitor garbage collection metrics

## Performance Testing

### Load Testing
\`\`\`go
func TestHighLoad(t *testing.T) {
    const numRequests = 10000
    const concurrency = 100
    
    var wg sync.WaitGroup
    requests := make(chan struct{}, numRequests)
    
    // Fill request channel
    for i := 0; i < numRequests; i++ {
        requests <- struct{}{}
    }
    close(requests)
    
    // Process requests concurrently
    for i := 0; i < concurrency; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for range requests {
                makeRequest()
            }
        }()
    }
    
    wg.Wait()
}
\`\`\`

## Common Performance Anti-Patterns

### Avoid These Mistakes
1. **Excessive memory allocations**
2. **Blocking operations in hot paths**
3. **Inefficient string operations**
4. **Poor goroutine management**
5. **Ignoring escape analysis**

## Real-World Case Studies

### Case Study 1: API Server Optimization
- **Problem**: High latency under load
- **Solution**: Connection pooling, worker pools, caching
- **Result**: 10x improvement in throughput

### Case Study 2: Data Processing Pipeline
- **Problem**: Memory pressure and GC pauses
- **Solution**: Object pooling, streaming processing
- **Result**: 50% reduction in memory usage

## Conclusion

Optimizing Go applications requires a deep understanding of the runtime, careful profiling, and systematic optimization. Start with profiling to identify bottlenecks, then apply the appropriate optimization techniques.

Remember: premature optimization is the root of all evil. Profile first, optimize second, and always measure the impact.`,
        author_id: "akshay_verma",
        author_name: "Akshay Verma",
        author_image: "/images/akshay.png",
        featured_image: "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=800",
        tags: ["golang", "performance", "optimization", "concurrency", "profiling"],
        categories: ["Programming", "Performance"],
        status: "published" as const,
        featured: true,
        views: 9876,
        likes: 234,
        reading_time: 18,
        seo_meta: {
          meta_title: "Golang Performance Optimization: Advanced Techniques 2024",
          meta_description: "Master Go performance optimization with advanced techniques for high-scale applications. Learn memory management, concurrency patterns, profiling, and benchmarking strategies.",
          canonical_url: "https://carelwave.com/blog/golang-performance-optimization-advanced-techniques",
          og_image: "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=1200"
        },
        created_at: Timestamp.fromDate(new Date('2024-01-25')),
        updated_at: Timestamp.fromDate(new Date('2024-01-25')),
        published_at: Timestamp.fromDate(new Date('2024-01-25'))
      },
      {
        title: "Kubernetes Production Deployment: Security, Monitoring, and Best Practices",
        slug: "kubernetes-production-deployment-security-monitoring",
        excerpt: "Complete guide to deploying applications in production Kubernetes clusters. Learn security hardening, monitoring setup, resource management, and operational best practices.",
        content: `# Kubernetes Production Deployment: Security, Monitoring, and Best Practices

## Introduction

Deploying applications to production Kubernetes requires careful planning, security considerations, and robust monitoring. This comprehensive guide covers everything you need to know for successful production deployments.

## Cluster Architecture for Production

### Multi-Master Setup
\`\`\`yaml
# High-availability control plane
apiVersion: kubeadm.k8s.io/v1beta3
kind: ClusterConfiguration
controlPlaneEndpoint: "k8s-api.example.com:6443"
etcd:
  external:
    endpoints:
    - https://etcd1.example.com:2379
    - https://etcd2.example.com:2379
    - https://etcd3.example.com:2379
\`\`\`

### Node Configuration
- **Master nodes**: 3+ for high availability
- **Worker nodes**: Auto-scaling enabled
- **Storage**: Persistent storage with backup strategy

## Security Hardening

### Network Policies
\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-web-traffic
spec:
  podSelector:
    matchLabels:
      app: web
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 80
\`\`\`

### Pod Security Standards
\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    runAsGroup: 1000
    fsGroup: 1000
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: app
    image: myapp:latest
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
        - ALL
    resources:
      limits:
        memory: "512Mi"
        cpu: "500m"
      requests:
        memory: "256Mi"
        cpu: "250m"
\`\`\`

### RBAC Configuration
\`\`\`yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
subjects:
- kind: ServiceAccount
  name: pod-reader-sa
  namespace: default
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
\`\`\`

## Resource Management

### Resource Quotas
\`\`\`yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    persistentvolumeclaims: "10"
\`\`\`

### Horizontal Pod Autoscaler
\`\`\`yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
\`\`\`

### Vertical Pod Autoscaler
\`\`\`yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: web-app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: app
      maxAllowed:
        cpu: 2
        memory: 4Gi
      minAllowed:
        cpu: 100m
        memory: 128Mi
\`\`\`

## Monitoring and Observability

### Prometheus Setup
\`\`\`yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    rule_files:
      - "/etc/prometheus/rules/*.yml"
    scrape_configs:
    - job_name: 'kubernetes-pods'
      kubernetes_sd_configs:
      - role: pod
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
\`\`\`

### Grafana Dashboards
Key metrics to monitor:
- **Cluster health**: Node status, pod status
- **Resource utilization**: CPU, memory, storage
- **Application metrics**: Request rate, error rate, latency
- **Network metrics**: Traffic patterns, network policies

### Alerting Rules
\`\`\`yaml
groups:
- name: kubernetes-alerts
  rules:
  - alert: HighPodCPUUsage
    expr: (sum(rate(container_cpu_usage_seconds_total[5m])) by (pod) * 100) > 80
    for: 5m
    labels:
      severity: warning
    
  - alert: PodRestartingTooOften
    expr: increase(kube_pod_container_status_restarts_total[1h]) > 5
    for: 0m
    labels:
      severity: critical
    annotations:
      summary: "Pod {{ $labels.pod }} is restarting too often"
\`\`\`

## Deployment Strategies

### Blue-Green Deployment
\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app-blue
  labels:
    version: blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
      version: blue
  template:
    metadata:
      labels:
        app: web-app
        version: blue
    spec:
      containers:
      - name: app
        image: myapp:v1.0.0
---
apiVersion: v1
kind: Service
metadata:
  name: web-app-service
spec:
  selector:
    app: web-app
    version: blue  # Switch to 'green' for deployment
  ports:
  - port: 80
    targetPort: 8080
\`\`\`

### Canary Deployment with Istio
\`\`\`yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: web-app-vs
spec:
  http:
  - match:
    - headers:
        canary:
          exact: "true"
    route:
    - destination:
        host: web-app-service
        subset: v2
  - route:
    - destination:
        host: web-app-service
        subset: v1
      weight: 90
    - destination:
        host: web-app-service
        subset: v2
      weight: 10
\`\`\`

## Backup and Disaster Recovery

### Velero Backup Configuration
\`\`\`yaml
apiVersion: velero.io/v1
kind: BackupStorageLocation
metadata:
  name: aws-backup-location
spec:
  provider: aws
  objectStorage:
    bucket: k8s-backups
    prefix: velero
  config:
    region: us-west-2
---
apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: daily-backup
spec:
  schedule: "0 2 * * *"
  template:
    includedNamespaces:
    - production
    - staging
    storageLocation: aws-backup-location
    ttl: 720h0m0s
\`\`\`

### Database Backup Strategy
\`\`\`yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
spec:
  schedule: "0 3 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: postgres-backup
            image: postgres:13
            command:
            - /bin/bash
            - -c
            - pg_dump $DATABASE_URL | gzip > /backup/backup-$(date +%Y%m%d).sql.gz
            env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: database-url
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          restartPolicy: OnFailure
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
\`\`\`

## Logging Strategy

### Centralized Logging with ELK Stack
\`\`\`yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: filebeat-config
data:
  filebeat.yml: |
    filebeat.inputs:
    - type: container
      paths:
        - /var/log/containers/*.log
      processors:
        - add_kubernetes_metadata:
            host: ${NODE_NAME}
            matchers:
            - logs_path:
                logs_path: "/var/log/containers/"
    
    output.elasticsearch:
      hosts: ["elasticsearch.logging.svc.cluster.local:9200"]
      index: "filebeat-%{+yyyy.MM.dd}"
\`\`\`

## Health Checks and Probes

### Comprehensive Health Checks
\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  template:
    spec:
      containers:
      - name: app
        image: myapp:latest
        ports:
        - containerPort: 8080
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        startupProbe:
          httpGet:
            path: /startup
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 30
\`\`\`

## Cost Optimization

### Resource Right-Sizing
\`\`\`bash
# Use kubectl-cost plugin
kubectl cost namespace production --window 7d

# Analyze resource recommendations
kubectl top pods --containers
kubectl describe vpa web-app-vpa
\`\`\`

### Spot Instances Configuration
\`\`\`yaml
apiVersion: v1
kind: Node
metadata:
  name: spot-node
  labels:
    node.kubernetes.io/instance-type: spot
spec:
  taints:
  - key: spot-instance
    value: "true"
    effect: NoSchedule
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: batch-processor
spec:
  template:
    spec:
      tolerations:
      - key: spot-instance
        operator: Equal
        value: "true"
        effect: NoSchedule
      nodeSelector:
        node.kubernetes.io/instance-type: spot
\`\`\`

## Troubleshooting Common Issues

### Debug Techniques
\`\`\`bash
# Pod debugging
kubectl describe pod <pod-name>
kubectl logs <pod-name> --previous
kubectl exec -it <pod-name> -- /bin/bash

# Network debugging
kubectl run debug --image=nicolaka/netshoot -it --rm
kubectl get networkpolicies

# Resource debugging
kubectl top nodes
kubectl top pods --all-namespaces
kubectl describe limitrange
\`\`\`

## Conclusion

Production Kubernetes deployment requires careful attention to security, monitoring, resource management, and operational procedures. Start with security-first principles, implement comprehensive monitoring, and establish robust operational procedures.

Remember: production readiness is not a destination but a continuous journey of improvement and optimization.`,
        author_id: "akshay_verma",
        author_name: "Akshay Verma",
        author_image: "/images/akshay.png",
        featured_image: "https://images.unsplash.com/photo-1667372393086-9d4001d51cf1?w=800",
        tags: ["kubernetes", "production", "security", "monitoring", "devops"],
        categories: ["DevOps", "Infrastructure"],
        status: "published" as const,
        featured: true,
        views: 11245,
        likes: 298,
        reading_time: 22,
        seo_meta: {
          meta_title: "Kubernetes Production Deployment: Security & Monitoring Guide 2024",
          meta_description: "Master Kubernetes production deployment with this comprehensive guide. Learn security hardening, monitoring setup, resource management, and operational best practices.",
          canonical_url: "https://carelwave.com/blog/kubernetes-production-deployment-security-monitoring",
          og_image: "https://images.unsplash.com/photo-1667372393086-9d4001d51cf1?w=1200"
        },
        created_at: Timestamp.fromDate(new Date('2024-01-30')),
        updated_at: Timestamp.fromDate(new Date('2024-01-30')),
        published_at: Timestamp.fromDate(new Date('2024-01-30'))
      },
      {
        title: "System Design Interview: Design a Real-Time Chat Application",
        slug: "system-design-interview-real-time-chat-application",
        excerpt: "Master system design interviews with this detailed walkthrough of designing a real-time chat application. Learn about scalability, WebSockets, message queues, and database design.",
        content: `# System Design Interview: Design a Real-Time Chat Application

## Interview Structure and Approach

System design interviews test your ability to architect large-scale distributed systems. This guide walks through designing a real-time chat application like WhatsApp or Slack, covering requirements gathering, architecture design, and deep dives into critical components.

## Phase 1: Requirements Clarification

### Functional Requirements
1. **User Management**
   - User registration and authentication
   - User profiles and status

2. **Messaging Features**
   - Send and receive text messages
   - Group chat support
   - Message history
   - Read receipts and typing indicators

3. **Real-time Features**
   - Instant message delivery
   - Online/offline status
   - Push notifications

### Non-Functional Requirements
1. **Scale**
   - 100 million daily active users
   - 10 billion messages per day
   - 1 million concurrent connections

2. **Performance**
   - Message delivery latency < 100ms
   - 99.9% availability
   - Eventually consistent data

3. **Storage**
   - Message retention for 1 year
   - Support for multimedia messages

## Phase 2: Capacity Estimation

### Traffic Estimates
\`\`\`
Daily Active Users: 100M
Messages per user per day: 100
Total messages per day: 10B
Messages per second: 10B / 86400 = ~115K messages/second
Peak traffic (3x average): ~350K messages/second
\`\`\`

### Storage Estimates
\`\`\`
Average message size: 100 bytes
Daily storage: 10B * 100 bytes = 1TB/day
Annual storage: 365TB
With replication (3x): ~1PB/year
\`\`\`

### Bandwidth Estimates
\`\`\`
Incoming data: 115K messages * 100 bytes = 11.5 MB/s
Outgoing data: 11.5 MB/s * 2 (delivery to recipient) = 23 MB/s
Peak bandwidth: ~70 MB/s
\`\`\`

## Phase 3: High-Level Architecture

### System Components

\`\`\`
[Mobile/Web Clients]
       |
[Load Balancer]
       |
[API Gateway]
       |
+-------------------+-------------------+
|                   |                   |
[Chat Service]  [User Service]  [Notification Service]
|                   |                   |
[Message Queue] [User Database]    [Push Service]
|
[Message Database]  [Cache Layer]
\`\`\`

### Architecture Patterns
1. **Microservices Architecture**: Separate services for different functionalities
2. **Event-Driven Architecture**: Asynchronous message processing
3. **CQRS Pattern**: Separate read and write operations
4. **Database per Service**: Independent data stores

## Phase 4: Detailed Component Design

### Real-Time Communication

#### WebSocket Connection Management
\`\`\`python
class WebSocketManager:
    def __init__(self):
        self.connections = {}  # user_id -> websocket_connection
        self.user_servers = {}  # user_id -> server_id
    
    async def connect_user(self, user_id, websocket):
        self.connections[user_id] = websocket
        self.user_servers[user_id] = self.server_id
        await self.update_user_status(user_id, "online")
    
    async def disconnect_user(self, user_id):
        if user_id in self.connections:
            del self.connections[user_id]
            del self.user_servers[user_id]
            await self.update_user_status(user_id, "offline")
    
    async def send_message(self, user_id, message):
        if user_id in self.connections:
            await self.connections[user_id].send(message)
        else:
            # User on different server, use message broker
            await self.publish_to_message_broker(user_id, message)
\`\`\`

#### Message Delivery Protocol
\`\`\`json
{
  "type": "message",
  "message_id": "uuid",
  "from_user_id": "user123",
  "to_user_id": "user456",
  "chat_id": "chat789",
  "content": "Hello World!",
  "timestamp": "2024-01-01T12:00:00Z",
  "message_type": "text"
}
\`\`\`

### Database Design

#### Message Storage Schema
\`\`\`sql
-- Messages table (sharded by chat_id)
CREATE TABLE messages (
    message_id UUID PRIMARY KEY,
    chat_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Partitioning by time for efficient cleanup
CREATE TABLE messages_2024_01 PARTITION OF messages
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Index for efficient querying
CREATE INDEX idx_messages_chat_time ON messages (chat_id, created_at DESC);
\`\`\`

#### Chat Metadata Schema
\`\`\`sql
-- Chats table
CREATE TABLE chats (
    chat_id UUID PRIMARY KEY,
    chat_type VARCHAR(20) NOT NULL, -- 'direct' or 'group'
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    last_message_at TIMESTAMP
);

-- Chat participants
CREATE TABLE chat_participants (
    chat_id UUID NOT NULL,
    user_id UUID NOT NULL,
    joined_at TIMESTAMP NOT NULL,
    role VARCHAR(20) DEFAULT 'member', -- 'admin', 'member'
    PRIMARY KEY (chat_id, user_id)
);
\`\`\`

### Message Processing Pipeline

#### Asynchronous Message Processing
\`\`\`python
class MessageProcessor:
    def __init__(self, message_queue, database):
        self.message_queue = message_queue
        self.database = database
    
    async def process_message(self, message):
        # 1. Validate message
        if not self.validate_message(message):
            return {"status": "error", "reason": "invalid_message"}
        
        # 2. Store in database
        message_id = await self.store_message(message)
        
        # 3. Update chat metadata
        await self.update_chat_metadata(message.chat_id, message.timestamp)
        
        # 4. Publish to delivery queue
        await self.publish_for_delivery(message_id, message)
        
        # 5. Update read receipts
        await self.update_read_receipts(message)
        
        return {"status": "success", "message_id": message_id}
    
    async def deliver_message(self, message):
        # Get chat participants
        participants = await self.get_chat_participants(message.chat_id)
        
        # Deliver to online users via WebSocket
        for participant in participants:
            if participant.user_id != message.sender_id:
                await self.websocket_manager.send_message(
                    participant.user_id, message
                )
        
        # Send push notifications to offline users
        await self.send_push_notifications(message, participants)
\`\`\`

### Caching Strategy

#### Multi-Level Caching
\`\`\`python
class CacheManager:
    def __init__(self):
        self.redis_client = Redis()
        self.local_cache = LRUCache(maxsize=10000)
    
    async def get_recent_messages(self, chat_id, limit=50):
        # Level 1: Local cache
        cache_key = f"recent_messages:{chat_id}:{limit}"
        messages = self.local_cache.get(cache_key)
        if messages:
            return messages
        
        # Level 2: Redis cache
        messages = await self.redis_client.lrange(
            f"chat:{chat_id}:messages", 0, limit-1
        )
        if messages:
            self.local_cache[cache_key] = messages
            return messages
        
        # Level 3: Database
        messages = await self.database.get_messages(chat_id, limit)
        
        # Cache in Redis for future requests
        await self.redis_client.lpush(
            f"chat:{chat_id}:messages", *messages
        )
        await self.redis_client.expire(
            f"chat:{chat_id}:messages", 3600
        )
        
        self.local_cache[cache_key] = messages
        return messages
\`\`\`

## Phase 5: Scalability Considerations

### Horizontal Scaling

#### Database Sharding
\`\`\`python
class MessageSharding:
    def __init__(self, num_shards=1000):
        self.num_shards = num_shards
    
    def get_shard(self, chat_id):
        # Consistent hashing for even distribution
        shard_id = hash(chat_id) % self.num_shards
        return f"messages_shard_{shard_id}"
    
    def get_database_connection(self, shard_id):
        # Route to appropriate database server
        server_id = shard_id % len(self.database_servers)
        return self.database_servers[server_id]
\`\`\`

#### Connection Scaling
\`\`\`python
# WebSocket server scaling with Redis pub/sub
class ScalableWebSocketManager:
    def __init__(self):
        self.redis_client = Redis()
        self.local_connections = {}
    
    async def start_listening(self):
        # Subscribe to Redis channels for cross-server communication
        pubsub = self.redis_client.pubsub()
        await pubsub.subscribe(f"server:{self.server_id}:messages")
        
        async for message in pubsub.listen():
            await self.handle_cross_server_message(message)
    
    async def send_message_to_user(self, user_id, message):
        # Check if user is connected to this server
        if user_id in self.local_connections:
            await self.local_connections[user_id].send(message)
        else:
            # Find which server has the user
            server_id = await self.redis_client.get(f"user:{user_id}:server")
            if server_id:
                await self.redis_client.publish(
                    f"server:{server_id}:messages",
                    json.dumps({"user_id": user_id, "message": message})
                )
\`\`\`

### Performance Optimization

#### Message Delivery Optimization
1. **Batch Processing**: Group multiple messages for efficient delivery
2. **Priority Queues**: Prioritize recent messages over historical ones
3. **Connection Pooling**: Reuse database connections
4. **Read Replicas**: Distribute read traffic across multiple databases

#### Caching Strategies
1. **Message Caching**: Cache recent messages in Redis
2. **User Session Caching**: Cache user authentication data
3. **Chat Metadata Caching**: Cache chat participant information
4. **CDN**: Cache static assets and media files

## Phase 6: Fault Tolerance and Reliability

### Message Delivery Guarantees

#### At-Least-Once Delivery
\`\`\`python
class ReliableMessageDelivery:
    async def send_message_with_retry(self, message, max_retries=3):
        for attempt in range(max_retries):
            try:
                # Store message with pending status
                message_id = await self.store_message_pending(message)
                
                # Attempt delivery
                delivery_result = await self.deliver_message(message)
                
                if delivery_result.success:
                    # Mark as delivered
                    await self.mark_message_delivered(message_id)
                    return delivery_result
                    
            except Exception as e:
                if attempt == max_retries - 1:
                    # Mark as failed after all retries
                    await self.mark_message_failed(message_id)
                    raise e
                
                # Exponential backoff
                await asyncio.sleep(2 ** attempt)
\`\`\`

#### Circuit Breaker Pattern
\`\`\`python
class CircuitBreaker:
    def __init__(self, failure_threshold=5, timeout=60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
    
    async def call(self, func, *args, **kwargs):
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.timeout:
                self.state = "HALF_OPEN"
            else:
                raise Exception("Circuit breaker is OPEN")
        
        try:
            result = await func(*args, **kwargs)
            self.on_success()
            return result
        except Exception as e:
            self.on_failure()
            raise e
\`\`\`

## Phase 7: Monitoring and Analytics

### Key Metrics to Monitor

#### System Metrics
\`\`\`python
class MetricsCollector:
    def __init__(self):
        self.metrics = {
            "messages_sent_per_second": 0,
            "messages_delivered_per_second": 0,
            "average_delivery_latency": 0,
            "websocket_connections": 0,
            "database_query_time": 0,
            "cache_hit_ratio": 0,
            "error_rate": 0
        }
    
    def record_message_sent(self):
        self.metrics["messages_sent_per_second"] += 1
        # Send to monitoring service (Prometheus, CloudWatch, etc.)
    
    def record_delivery_latency(self, latency_ms):
        # Update running average
        self.metrics["average_delivery_latency"] = (
            self.metrics["average_delivery_latency"] * 0.9 + latency_ms * 0.1
        )
\`\`\`

#### Business Metrics
- Active users per day/hour
- Messages per user
- Chat engagement rates
- Feature adoption rates

### Alerting Strategy
\`\`\`yaml
# Prometheus alerting rules
groups:
- name: chat-system-alerts
  rules:
  - alert: HighMessageDeliveryLatency
    expr: average_delivery_latency > 500
    for: 5m
    labels:
      severity: warning
    
  - alert: DatabaseConnectionErrors
    expr: database_error_rate > 0.05
    for: 2m
    labels:
      severity: critical
\`\`\`

## Conclusion

Designing a real-time chat application involves numerous architectural decisions and trade-offs. Key considerations include:

1. **Scalability**: Horizontal scaling with proper sharding strategies
2. **Real-time Communication**: WebSocket management and message brokers
3. **Data Consistency**: Eventual consistency with conflict resolution
4. **Fault Tolerance**: Circuit breakers, retries, and graceful degradation
5. **Performance**: Multi-level caching and efficient data structures

Remember to start simple, measure performance, and scale incrementally based on actual usage patterns and requirements.

This design provides a solid foundation that can be adapted and extended based on specific requirements and constraints.`,
        author_id: "akshay_verma",
        author_name: "Akshay Verma",
        author_image: "/images/akshay.png",
        featured_image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800",
        tags: ["system-design", "interview", "scalability", "real-time", "architecture"],
        categories: ["System Design", "Interview"],
        status: "published" as const,
        featured: true,
        views: 18765,
        likes: 456,
        reading_time: 25,
        seo_meta: {
          meta_title: "System Design Interview: Real-Time Chat Application Guide 2024",
          meta_description: "Master system design interviews with this comprehensive guide to designing a real-time chat application. Learn scalability, WebSockets, message queues, and database design patterns.",
          canonical_url: "https://carelwave.com/blog/system-design-interview-real-time-chat-application",
          og_image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200"
        },
        created_at: Timestamp.fromDate(new Date('2024-02-05')),
        updated_at: Timestamp.fromDate(new Date('2024-02-05')),
        published_at: Timestamp.fromDate(new Date('2024-02-05'))
      }
    ];
  }

  // Initialize sample posts if collection is empty
  async initializeSamplePosts(): Promise<void> {
    try {
      const postsCollection = collection(db, this.collectionName);
      const snapshot = await getDocs(query(postsCollection, limit(1)));
      
      if (snapshot.empty) {
        console.log('🚀 Initializing sample posts...');
        const samplePosts = this.getSamplePosts();
        
        for (const post of samplePosts) {
          await addDoc(postsCollection, post);
        }
        
        console.log('✅ Sample posts initialized successfully');
      }
    } catch (error) {
      console.error('❌ Failed to initialize sample posts:', error);
    }
  }

  // Convert Firestore document to Post interface
  private convertToPost(doc: QueryDocumentSnapshot<DocumentData>): Post {
    const data = doc.data() as FirebasePost;
    return {
      id: doc.id,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      author_id: data.author_id,
      author_name: data.author_name,
      author_image: data.author_image,
      featured_image: data.featured_image,
      tags: data.tags,
      categories: data.categories,
      status: data.status,
      featured: data.featured,
      views: data.views,
      likes: data.likes,
      reading_time: data.reading_time,
      created_at: data.created_at.toDate().toISOString(),
      updated_at: data.updated_at.toDate().toISOString(),
      published_at: data.published_at?.toDate().toISOString()
    };
  }

  // Get all published posts
  async getAllPosts(): Promise<Post[]> {
    try {
      await this.initializeSamplePosts();
      
      const postsCollection = collection(db, this.collectionName);
      const q = query(
        postsCollection,
        where('status', '==', 'published'),
        orderBy('published_at', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.convertToPost(doc));
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  }

  // Get featured posts
  async getFeaturedPosts(limitCount: number = 3): Promise<Post[]> {
    try {
      const postsCollection = collection(db, this.collectionName);
      const q = query(
        postsCollection,
        where('status', '==', 'published'),
        where('featured', '==', true),
        orderBy('published_at', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.convertToPost(doc));
    } catch (error) {
      console.error('Error fetching featured posts:', error);
      return [];
    }
  }

  // Get post by slug
  async getPostBySlug(slug: string): Promise<Post | null> {
    try {
      const postsCollection = collection(db, this.collectionName);
      const q = query(
        postsCollection,
        where('slug', '==', slug),
        where('status', '==', 'published')
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }
      
      const post = this.convertToPost(snapshot.docs[0]);
      
      // Increment view count
      await this.incrementViews(snapshot.docs[0].id);
      
      return post;
    } catch (error) {
      console.error('Error fetching post by slug:', error);
      return null;
    }
  }

  // Get post by ID
  async getPostById(id: string): Promise<Post | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return this.convertToPost(docSnap);
    } catch (error) {
      console.error('Error fetching post by ID:', error);
      return null;
    }
  }

  // Search posts
  async searchPosts(searchTerm: string): Promise<Post[]> {
    try {
      const postsCollection = collection(db, this.collectionName);
      const q = query(
        postsCollection,
        where('status', '==', 'published'),
        orderBy('published_at', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const allPosts = snapshot.docs.map(doc => this.convertToPost(doc));
      
      // Simple text search (in production, use Algolia or Elasticsearch)
      const searchTermLower = searchTerm.toLowerCase();
      return allPosts.filter(post => 
        post.title.toLowerCase().includes(searchTermLower) ||
        post.excerpt.toLowerCase().includes(searchTermLower) ||
        post.content.toLowerCase().includes(searchTermLower) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTermLower))
      );
    } catch (error) {
      console.error('Error searching posts:', error);
      return [];
    }
  }

  // Get posts by category
  async getPostsByCategory(category: string): Promise<Post[]> {
    try {
      const postsCollection = collection(db, this.collectionName);
      const q = query(
        postsCollection,
        where('status', '==', 'published'),
        where('categories', 'array-contains', category),
        orderBy('published_at', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.convertToPost(doc));
    } catch (error) {
      console.error('Error fetching posts by category:', error);
      return [];
    }
  }

  // Get posts by tag
  async getPostsByTag(tag: string): Promise<Post[]> {
    try {
      const postsCollection = collection(db, this.collectionName);
      const q = query(
        postsCollection,
        where('status', '==', 'published'),
        where('tags', 'array-contains', tag),
        orderBy('published_at', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.convertToPost(doc));
    } catch (error) {
      console.error('Error fetching posts by tag:', error);
      return [];
    }
  }

  // Increment post views
  async incrementViews(postId: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, postId);
      await updateDoc(docRef, {
        views: increment(1)
      });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  }

  // Increment post likes
  async incrementLikes(postId: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, postId);
      await updateDoc(docRef, {
        likes: increment(1)
      });
    } catch (error) {
      console.error('Error incrementing likes:', error);
    }
  }

  // Create new post (admin only)
  async createPost(postData: Omit<FirebasePost, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const postsCollection = collection(db, this.collectionName);
      const docRef = await addDoc(postsCollection, {
        ...postData,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  // Update post (admin only)
  async updatePost(postId: string, updates: Partial<FirebasePost>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, postId);
      await updateDoc(docRef, {
        ...updates,
        updated_at: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  // Delete post (admin only)
  async deletePost(postId: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, postId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  // Get all categories
  async getCategories(): Promise<string[]> {
    try {
      const postsCollection = collection(db, this.collectionName);
      const q = query(
        postsCollection,
        where('status', '==', 'published')
      );
      
      const snapshot = await getDocs(q);
      const categorySet = new Set<string>();
      
      snapshot.docs.forEach(doc => {
        const data = doc.data() as FirebasePost;
        data.categories.forEach(category => categorySet.add(category));
      });
      
      return Array.from(categorySet).sort();
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // Get all tags
  async getTags(): Promise<string[]> {
    try {
      const postsCollection = collection(db, this.collectionName);
      const q = query(
        postsCollection,
        where('status', '==', 'published')
      );
      
      const snapshot = await getDocs(q);
      const tagSet = new Set<string>();
      
      snapshot.docs.forEach(doc => {
        const data = doc.data() as FirebasePost;
        data.tags.forEach(tag => tagSet.add(tag));
      });
      
      return Array.from(tagSet).sort();
    } catch (error) {
      console.error('Error fetching tags:', error);
      return [];
    }
  }
}

export const firebasePostsService = new FirebasePostsService(); 