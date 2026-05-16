import type { ArenaQuestion } from './index';

export const agentQuestions: ArenaQuestion[] = [
  {
    id: 'agent-1',
    category: 'agent',
    question:
      '你是一个数据分析助手，拥有以下工具：\n\n' +
      '可用工具：\n' +
      '- database_query(sql: string) → 查询数据库，返回表格数据。可能抛出：QueryTimeout（查询超时）、SyntaxError（SQL语法错误）、PermissionDenied（无权限）、TableNotFound（表不存在）\n' +
      '- code_run(code: string, language: string) → 执行代码，返回stdout。可能抛出：ExecutionTimeout（执行超时）、RuntimeError（运行时错误）、MemoryLimitExceeded（内存超限）\n' +
      '- search(query: string) → 搜索网络，返回相关文档摘要列表。可能抛出：RateLimited（请求频率限制）、NoResults（无结果）\n' +
      '- send_email(to: string, subject: string, body: string) → 发送邮件。可能抛出：InvalidAddress（地址无效）、DeliveryFailed（投递失败）\n' +
      '- calculator(expr: string) → 计算数学表达式。可能抛出：DivisionByZero、MathError\n\n' +
      '用户请求："帮我调查公司2023年Q4的销售数据异常——销售额比Q3下降了35%，CEO要求今天下班前看到分析报告并发到她邮箱 ceo@company.com。数据库表名和结构你不知道，需要自己摸索。"\n\n' +
      '请提供完整的执行计划，包括：\n' +
      '1. 每一步的操作目的\n' +
      '2. 使用的工具名称和完整输入参数\n' +
      '3. 预期的正常输出\n' +
      '4. 针对每种可能的错误，给出具体的恢复策略（不要只写"重试"）\n' +
      '5. 步骤间的依赖关系（哪些可以并行、哪些必须串行）\n' +
      '6. 你如何判断"销售额下降35%"这个说法本身是否可靠',
    scoringRubric:
      '评估维度：\n' +
      '1) 探索策略：是否有步骤先发现数据库结构（如 information_schema、SHOW TABLES 等），而非盲目查询——缺少探索步骤扣2分\n' +
      '2) 错误恢复：针对每种错误类型有具体恢复策略（如 QueryTimeout→加 LIMIT 重试、TableNotFound→查 schema、PermissionDenied→换表或通知用户），泛泛而谈扣2分\n' +
      '3) 并行/串行识别：数据库结构查询与网络搜索可并行；数据查询必须等结构发现；邮件必须等分析完成——识别错误扣1分\n' +
      '4) 数据验证：是否验证"下降35%"这个前提（如重新计算Q3/Q4数据、检查数据完整性、排除数据缺失导致的假下降）——缺少验证扣2分\n' +
      '5) 完整性：从探索→查询→分析→验证→生成报告→发送的完整链路，缺环节扣1分\n' +
      '6) 工具使用准确性：参数格式正确、不编造工具，错误扣1分。累积扣至0分。',
    maxScore: 10,
    referenceAnswer: '执行计划（共7步，标注并行/串行依赖）：\n\n【步骤1·探索数据库结构】目的：发现表名和字段，避免盲目查询。工具：database_query(sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()")。正常输出：得到所有表名列表（如 sales_orders, customers, products 等）。错误恢复：(a)QueryTimeout→加 LIMIT 10 重试 database_query(sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() LIMIT 10")；(b)TableNotFound→用 database_query(sql: "SHOW TABLES") 作为备选；(c)PermissionDenied for information_schema→尝试 database_query(sql: "SHOW TABLES")，若仍无权限则通知用户需DBA授权；(d)SyntaxError→检查SQL引号和大小写，改用 database_query(sql: "SHOW TABLES")。并行关系：步骤1可与步骤2并行。\n\n【步骤2·搜索公司背景】目的：了解公司业务和可能的数据库结构。工具：search(query: "公司2023 Q3 Q4 销售数据 季度报表 结构")。正常输出：获得公司相关的公开文档或系统说明。错误恢复：(a)RateLimited→等待1分钟重试，期间执行步骤1；(b)NoResults→缩小搜索词 search(query: "销售季度报表 数据表结构")。并行关系：步骤1与步骤2并行。\n\n【步骤3·探索各表结构】目的：确认关键表（尤其是销售相关）的字段。依赖：步骤1完成后执行。工具（并行查询，每个独立可串行回退）：(a) database_query(sql: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name LIKE \'%sales%\' OR table_name LIKE \'%order%\' OR table_name LIKE \'%revenue%\' ORDER BY table_name, ordinal_position")；(b) database_query(sql: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name LIKE \'%quarter%\' OR table_name LIKE \'%q3%\' OR table_name LIKE \'%q4%\' OR table_name LIKE \'%2023%\'")。正常输出：各表字段名和数据类型。错误恢复：如某查询超时→分别查询每个匹配表。如所有查询无结果→扩大搜索 database_query(sql: "SHOW COLUMNS FROM [step1发现的每个表]")。\n\n【步骤4·查询Q3和Q4销售数据】目的：获取原始数据进行验证。依赖：步骤3完成后执行（需知道表名和字段）。工具（并行两查询）：(a) database_query(sql: "SELECT SUM(amount) as q3_total, COUNT(*) as q3_orders, AVG(amount) as q3_avg, MIN(order_date) as q3_start, MAX(order_date) as q3_end FROM sales_orders WHERE YEAR(order_date)=2023 AND QUARTER(order_date)=3")；(b) database_query(sql: "SELECT SUM(amount) as q4_total, COUNT(*) as q4_orders, AVG(amount) as q4_avg, MIN(order_date) as q4_start, MAX(order_date) as q4_end FROM sales_orders WHERE YEAR(order_date)=2023 AND QUARTER(order_date)=4")。正常输出：Q3和Q4的总销售额、订单数、均价、时间范围。错误恢复：(a)TableNotFound→回到步骤1重新查表名，确认sales_orders的实际表名；(b)QueryTimeout→分别加 LIMIT 并分页查询；(c)字段名不对（amount不存在）→查具体字段名 database_query(sql: "SELECT * FROM [表名] LIMIT 1") 确认实际字段。\n\n【步骤5·数据验证与重新计算】目的：验证"下降35%"是否可靠，排除数据缺失、口径不一致等问题。依赖：步骤4完成后执行。工具：calculator 和 code_run。(a)先用 calculator(expr: "(q3_total - q4_total) / q3_total * 100") 计算实际降幅；(b)用 code_run 写分析脚本检查数据完整性：检查Q4是否晚于某个日期没有数据、是否有异常大单影响、按产品线/区域拆分看哪个维度下降、对比去年同期Q4。code_run 参数：language="python"，code为完整分析脚本（含异常检测、趋势分析）。正常输出：验证后的实际降幅及分解分析。错误恢复：(a)ExecutionTimeout→拆分脚本，先做汇总再细分；(b)MemoryLimitExceeded→用 database_query 分批拉取，减少内存中数据量；(c)RuntimeError→检查脚本中列名是否匹配，加 try-except 捕获并输出中间结果；(d)calculator DivisionByZero→检查Q3是否为0，若是则说明对比基准有问题需重新确认。\n\n【步骤6·生成分析报告】目的：整理发现、形成结构化报告。依赖：步骤4和步骤5完成后执行。工具：code_run(language="markdown"或 python 生成格式化文本，实际使用 code_run 生成报告文本)。报告内容：(1)结论摘要——实际降幅是多少，与声称的35%是否一致；(2)数据验证结果——数据完整性、口径一致性；(3)细分分析——按产品/区域/客户维度；(4)异常定位——哪个维度贡献最大降幅；(5)行动建议。正常输出：Markdown格式的分析报告文本。错误恢复：ExecutionTimeout→分章节执行。\n\n【步骤7·发送邮件】目的：将报告发送给CEO。依赖：步骤6完成后执行。工具：send_email(to: "ceo@company.com", subject: "2023 Q4 销售额分析报告 - 异常调查结果", body: "[步骤6生成的报告全文]")。正常输出：邮件发送成功确认。错误恢复：(a)InvalidAddress→用 search(query: "company CEO email") 确认或请用户提供备选邮箱；(b)DeliveryFailed→等待5分钟重试，若仍失败则通知用户手动发送或改用其他渠道。\n\n【如何判断"下降35%"是否可靠】：(1)先确认数据完整性——Q4是否已完全结束、所有订单是否已录入；(2)检查统计口径——退货是否扣除、含税/不含税口径是否一致；(3)排除一次性因素——是否有大单在Q3而非Q4、Q4是否有数据延迟录入；(4)按细分维度验证——如果某个区域/产品线明显异常则定位具体原因而非笼统归因；(5)同比验证——与2022年Q4对比看是否季节性因素。只有经过上述5层验证的降幅才可作为可靠结论。',
  },
  {
    id: 'agent-2',
    category: 'agent',
    question:
      '你是一个 DevOps 自动化助手，负责排查一个生产环境故障。你的工具：\n\n' +
      '可用工具：\n' +
      '- ssh_exec(host: string, command: string) → 在远程服务器执行命令。可能抛出：ConnectionRefused、AuthenticationFailed、CommandTimeout、HostUnreachable\n' +
      '- log_query(service: string, time_range: string, filter: string) → 查询日志服务。可能抛出：ServiceNotFound、InvalidTimeRange、RateLimited、LogStorageUnavailable\n' +
      '- metric_query(host: string, metric: string, time_range: string) → 查询监控指标。可能抛出：MetricNotFound、HostNotFound、Timeout\n' +
      '- deploy(service: string, version: string, env: string) → 部署服务。可能抛出：VersionNotFound、DeployFailed、HealthCheckFailed、RollbackTriggered\n' +
      '- notify(channel: string, message: string) → 发送通知。可能抛出：ChannelNotFound、RateLimited\n\n' +
      '故障现象：用户报告 API 响应变慢，P99延迟从200ms飙升到5s。服务架构：前端→API网关→3个微服务（user-service, order-service, payment-service）→数据库。每个微服务部署在3个容器实例上。\n\n' +
      '请提供完整的排查和修复计划：\n' +
      '1. 排查步骤的优先级排序和理由\n' +
      '2. 每步使用的工具和精确输入\n' +
      '3. 如何快速缩小问题范围（哪些步骤可以并行执行来加速定位）\n' +
      '4. 针对以下每种根因场景给出不同处置方案：数据库慢查询、某个微服务内存泄漏、网络分区、部署了错误版本\n' +
      '5. 何时决定回滚 vs 热修复，决策标准是什么\n' +
      '6. 何时通知 stakeholders，通知内容应包含什么',
    scoringRubric:
      '评估维度：\n' +
      '1) 排查优先级：应先查监控指标定位瓶颈（API网关→各微服务→DB），再查日志找原因——优先级混乱扣2分\n' +
      '2) 并行策略：可同时查询3个微服务的指标和日志加速定位——未利用并行扣1分\n' +
      '3) 根因处置：4种场景各有针对性方案（慢查询→加索引/限流；内存泄漏→重启+排查；网络分区→切可用区；错版本→回滚）——每种场景缺少合理处置扣1分\n' +
      '4) 回滚决策：有明确决策标准（如影响用户数阈值、修复时间预估、回滚风险），模糊扣1.5分\n' +
      '5) 通知时机：应在确认影响范围后、修复行动前通知，而非等完全修复——时机不当扣1分\n' +
      '6) 工具使用：ssh_exec用于查看系统状态、log_query查错误日志、metric_query查延迟/资源、deploy用于回滚——用错工具扣1分。累积扣至0分。',
    maxScore: 10,
    referenceAnswer: '排查与修复计划（优先级从高到低）：\n\n【第1优先级·监控指标全量查询——定位瓶颈层】目的：P99延迟从200ms→5s，最快定位方法是看指标在哪一层剧增。并行查询所有关键节点（API网关+3个微服务+数据库）的P99延迟和错误率。工具：metric_query。(a) metric_query(host: "api-gateway-prod", metric: "p99_latency", time_range: "last 1 hour")；(b) metric_query(host: "user-service-prod", metric: "p99_latency", time_range: "last 1 hour")；(c) metric_query(host: "order-service-prod", metric: "p99_latency", time_range: "last 1 hour")；(d) metric_query(host: "payment-service-prod", metric: "p99_latency", time_range: "last 1 hour")；(e) metric_query(host: "db-primary", metric: "query_latency_p99", time_range: "last 1 hour")。以上5个查询全部并行发出。正常输出：各节点的P99延迟曲线，可立即判断延迟激增发生在哪一层。错误恢复：(a)MetricNotFound→用 metric_query 查 "avg_latency" 或 "response_time" 替代；(b)HostNotFound→用 ssh_exec(host: "[hostname]", command: "hostname") 确认主机名；(c)Timeout→缩短 time_range 为 "last 15 minutes"。\n\n【第2优先级·根据指标结果缩小范围】目的：假设第1步发现order-service延迟最高（10s），则聚焦该服务。追加查询：(a) metric_query(host: "order-service-prod", metric: "container_cpu_usage", time_range: "last 1 hour")；(b) metric_query(host: "order-service-prod", metric: "container_memory_usage", time_range: "last 1 hour")；(c) metric_query(host: "order-service-prod", metric: "error_rate", time_range: "last 1 hour")；(d) metric_query(host: "db-primary", metric: "slow_query_count", time_range: "last 1 hour")。以上4个并行。\n\n【第3优先级·日志排查——确定根因】目的：窄化范围后查日志找具体错误。工具：log_query。(a) 若延迟集中在order-service：log_query(service: "order-service", time_range: "last 1 hour", filter: "level=ERROR OR level=WARN OR latency>1000")；(b) 若DB指标异常：log_query(service: "db-logs", time_range: "last 1 hour", filter: "slow_query OR lock OR deadlock")；(c) log_query(service: "api-gateway", time_range: "last 1 hour", filter: "status=504 OR status=502 OR timeout")。以上3个可并行。正常输出：包含具体错误信息和时间戳的日志条目。错误恢复：(a)ServiceNotFound→用 ssh_exec 在对应服务器直接 grep 日志文件；(b)RateLimited→按时间分片查询；(c)LogStorageUnavailable→用 ssh_exec(host: "[service-host]", command: "journalctl -u [service] --since \"1 hour ago\" | grep -E \'(ERROR|timeout|500)\'")。\n\n【第4优先级·根因确认与处置】根据前3步发现选择对应方案：\n\n根因场景A·数据库慢查询：(1)ssh_exec查DB连接数 ssh_exec(host: "db-primary", command: "mysql -e \"SHOW PROCESSLIST\" | grep -c -v sleep")；(2)查索引 state_query(服务名: "db-logs", time_range: "last 1 hour", filter: "rows_examined>10000") 定位慢SQL；(3)处置——紧急加索引（如 EXPLAIN 确认全表扫描），对高并发查询加限流 (deploy(order-service, version: "hotfix-query-limit", env: "prod"))；(4)长期——优化查询计划，增加读副本。\n\n根因场景B·微服务内存泄漏：确认指标 container_memory_usage 持续增长且GC频繁（ssh_exec 查 jstat）；处置——先做滚动重启 deploy(order-service, version: "[current]", strategy: "rolling") 缓解；同时分析 heap dump 定位泄漏点（ssh_exec(host: "order-service-01", command: "jmap -dump:format=b,file=/tmp/heap.hprof $(pgrep -f order-service)")）。\n\n根因场景C·网络分区：(1)ssh_exec 查网络连通性 ssh_exec(host: "order-service-01", command: "mtr -r -c10 api-gateway")、查丢包率 ssh_exec(host: "order-service-01", command: "ping -c 100 api-gateway | grep loss")；(2)查连接重试指标 metric_query(host: "order-service-01", metric: "tcp_retransmit_rate", time_range: "last 1 hour")；(3)处置——确认故障网络节点后做流量切换路由到可用区。\n\n根因场景D·部署错误版本：(1)检查部署记录 metric_query(host: "order-service-prod", metric: "deployment_timestamp", time_range: "last 24 hours") → 若近期有部署则查版本号；(2)处置——确认错误版本后立即回滚 deploy(order-service, version: "[上一个稳定版本号]", env: "prod")。\n\n【回滚 vs 热修复 决策标准】：(1)回滚条件——故障影响用户数>1%、问题定位时间预计>30分钟、已知上一个稳定版本可用、修复需要大规模代码变更。满足任一即优先回滚。(2)热修复条件——问题定位明确（如已知SQL慢查询）、修复范围小（单行配置或参数调整）、修复后可快速验证健康检查、回滚对用户影响更大（如回滚涉及数据迁移）。(3)决策流程——先回滚止损，再在预发布环境修复验证，合并后重新部署。\n\n【通知策略】：(1)时机——确认影响范围后（第1步做完有初步判断时）立即通知，不等完全修复。notify(channel: "#incident-response", message: "[初步通知] API P99延迟从200ms飙升至5s，正在排查中，疑似[order-service/数据库]异常，影响范围[全量用户]，下一步将[查看日志/重启服务]")。(2)后续通知——每30分钟更新进度，修复完成后发送总结 notify(channel: "#incident-response", message: "[修复完成] 根因：[具体原因]；处置：[具体操作]；恢复时间：[时间]；P99延迟已恢复至[数值]；后续措施：[防复发计划]")。(3)通知对象——#incident-response（技术团队）、#engineering（工程群）、受影响业务负责人。错误恢复：(a)ChannelNotFound→改用 notify(recipient: "[oncall工程师邮箱]", message: ..., urgency: "critical")；(b)RateLimited→合并通知减少频率。',
  },
  {
    id: 'agent-3',
    category: 'agent',
    question:
      '你是一个数据工程助手，需要设计一个 ETL 数据管道。你的工具：\n\n' +
      '可用工具：\n' +
      '- schema_inspect(source: string) → 检查数据源的schema。可能抛出：SourceUnavailable、AuthRequired、SchemaChanged（schema与上次不同）\n' +
      '- data_sample(source: string, n: number) → 抽样n条数据预览。可能抛出：SourceUnavailable、InsufficientData（数据不足n条）\n' +
      '- transform_validate(transform_code: string, sample_data: any) → 在样本数据上验证转换逻辑。可能抛出：CompilationError、TransformError、OutputSchemaMismatch\n' +
      '- pipeline_create(config: object) → 创建管道。可能抛出：ConfigValidationError、QuotaExceeded、DependencyConflict\n' +
      '- pipeline_test(pipeline_id: string, test_data: object) → 测试管道。可能抛出：PipelineNotFound、TestFailed、Timeout\n' +
      '- pipeline_deploy(pipeline_id: string, env: string) → 部署到环境。可能抛出：PipelineNotFound、DeployFailed、ScheduleConflict\n' +
      '- alert_create(condition: string, channel: string) → 创建监控告警。可能抛出：InvalidCondition、ChannelNotFound\n\n' +
      '需求：从3个数据源（MySQL订单表、MongoDB用户行为日志、S3产品图片元数据CSV）每日同步数据到数据仓库，做清洗、关联、聚合后，输出到3张汇总表供BI使用。数据量：订单约500万/日，日志约2亿/日，图片元数据约10万/日。\n\n' +
      '请给出：\n' +
      '1. 完整的分阶段执行计划（从数据源探查到生产部署）\n' +
      '2. 每阶段使用的工具和输入\n' +
      '3. 3个数据源的处理顺序和依赖关系（哪些必须串行、哪些可并行）\n' +
      '4. 如何处理 schema 变更（数据源方可能改表结构）\n' +
      '5. 如何处理数据质量问题（缺失、重复、格式不一致、延迟到达）\n' +
      '6. 告警策略：什么条件触发告警，发给谁\n' +
      '7. 如果 pipeline_test 失败，你的诊断和修复流程',
    scoringRubric:
      '评估维度：\n' +
      '1) 阶段完整性：探查→采样→转换开发→验证→测试→部署→监控，缺阶段扣1分\n' +
      '2) 数据量感知：对2亿/日的日志应有特殊处理策略（分区、增量同步、采样验证），忽略数据量级扣2分\n' +
      '3) 并行策略：3个数据源的探查和采样可并行；订单和用户日志的关联需串行——错误安排扣1分\n' +
      '4) Schema变更处理：有 schema_inspect 前置检查+变更时的告警和适配流程，缺失扣1.5分\n' +
      '5) 数据质量策略：去重、空值处理、格式标准化、延迟数据补跑等，每种缺少扣0.5分\n' +
      '6) 告警策略：有具体条件（如延迟>30分钟、错误率>1%、数据量偏差>20%），泛泛扣1分\n' +
      '7) 测试失败诊断：先看错误类型再针对性修复（SchemaMismatch→调整转换、TestFailed→查日志、Timeout→优化或加资源），流程不合理扣1分。累积扣至0分。',
    maxScore: 10,
    referenceAnswer: 'ETL管道设计分6阶段执行：\n\n【阶段1·数据源探查】目的：理解3个数据源的结构、字段类型、数据质量基线。工具：schema_inspect 和 data_sample。3个数据源探查可完全并行：\n(a) schema_inspect(source: "mysql://prod/orders") → 获取MySQL订单表schema（字段名、类型、主键、索引）。并行执行 data_sample(source: "mysql://prod/orders", n: 100) → 获取样本数据。错误恢复：SourceUnavailable→重试3次间隔30s，仍失败则联系DBA检查源库状态；AuthRequired→通知用户提供凭证或配置服务账号。\n(b) schema_inspect(source: "mongodb://prod/user_behavior") → 获取MongoDB集合的字段结构（注意MongoDB无强schema，需通过data_sample推导实际结构）。并行执行 data_sample(source: "mongodb://prod/user_behavior", n: 100)。错误恢复：SchemaChanged→对比上次schema，记录变更字段（新增/删除/类型变更），标记为需适配点。\n(c) schema_inspect(source: "s3://bucket/product_metadata_csv") → 检查CSV文件头。并行执行 data_sample(source: "s3://bucket/product_metadata_csv", n: 20)。错误恢复：InsufficientData→n值降级为可用数据量。\n3个数据源的探查和采样并行完成，无依赖关系。\n\n【阶段2·转换逻辑开发】目的：基于样本数据开发清洗和关联转换逻辑。依赖：阶段1完成后。工具有序（串行）：\n(1) 订单表转换——transform_validate(transform_code: "SELECT order_id, customer_id, product_id, amount, quantity, order_date, REGEXP_REPLACE(status, \'[^a-z]\', \'\') as clean_status FROM orders WHERE order_date IS NOT NULL AND amount > 0", sample_data: [阶段1样本])。错误恢复：CompilationError→检查SQL语法，使用平台支持的方言；TransformError→检查样本数据中特殊值（空值、溢出、特殊字符）；OutputSchemaMismatch→调整SELECT字段匹配目标表schema。\n(2) 用户日志清洗——对2亿/日的数据量，采用增量+分区策略：按小时分区读取，transform_validate 只验证最近1小时样本。转换逻辑：去重（按user_id + event_time + event_type去重窗口内重复）、会话化（按session_id聚合事件序列）、字段标准化（统一时间格式、IP格式、枚举值映射）。\n(3) 图片元数据——验证CSV格式一致性、处理编码问题（UTF-8 BOM、中文乱码）、缺失值填充（缺失width/height用默认值或标记为NULL）。\n\n【阶段3·关联逻辑开发】依赖：订单和用户行为均完成阶段2。\n(1) 订单-用户行为关联：以 order_id 或 customer_id+时间窗口 JOIN，生成订单转化归因表。transform_validate 验证关联率和关联键覆盖率。\n(2) 订单-产品元数据关联：以 product_id JOIN，补充产品信息。\n(3) 最终产出3张汇总表架构：(a)dws_sales_summary_daily（日销售汇总，订单聚合+归因）；(b)dws_user_behavior_daily（日用户行为汇总，按事件类型/漏斗阶段聚合）；(c)dws_product_performance_daily（日产品表现，订单+元数据+用户交互）。\n\n【阶段4·管道创建与测试】依赖：阶段2和阶段3完成。\n(1) pipeline_create(config: {name: "etl-daily-sync", sources: ["mysql-orders", "mongo-behavior", "s3-metadata"], schedule: "0 3 * * *", partitions: {orders: "order_date", behavior: "event_hour"}, error_handling: {on_failure: "partial", dead_letter: "s3://dlq/"}})。错误恢复：ConfigValidationError→按错误提示逐个修正配置字段；QuotaExceeded→申请扩容或减少初始并行度；DependencyConflict→检查与其他管道的调度时间和资源竞争。\n(2) pipeline_test(pipeline_id: "[从pipeline_create获取的ID]", test_data: {orders: "[样本]", behavior: "[样本]", metadata: "[样本]")。错误恢复：PipelineNotFound→确认ID正确、等待3s后重试；TestFailed→查看错误日志，按类型修复（SchemaMismatch→回到阶段2调整转换；数据格式问题→阶段2增加清洗规则）；Timeout→检查数据量，是否需要增加资源或降低测试数据规模。\n\n【阶段5·生产部署】依赖：阶段4测试通过。pipeline_deploy(pipeline_id: "[ID]", env: "production")。错误恢复：DeployFailed→检查生产环境权限和资源配置；ScheduleConflict→调整调度时间错开高峰。\n\n【阶段6·监控告警】依赖：阶段5部署成功。alert_create(condition: "pipeline_lag > 1800", channel: "#data-alert") → 延迟超过30分钟告警；alert_create(condition: "error_rate > 0.01", channel: "#data-alert") → 错误率>1%告警；alert_create(condition: "row_count_deviation > 0.2", channel: "#data-quality") → 数据量偏差>20%告警（可能源数据异常或管道卡住）；alert_create(condition: "null_rate > 0.05", channel: "#data-quality") → 关键字段空值率>5%告警；alert_create(condition: "duplicate_rate > 0.02", channel: "#data-quality") → 重复率>2%告警。错误恢复：InvalidCondition→检查条件语法；ChannelNotFound→创建通知渠道或用notify替代。\n\n【数据量级特殊处理】：(1)日志2亿/日——按 event_hour 分区，增量读取每小时分区，避免全量扫描；管道内做微批次处理（每批10万条）；transform_validate 只在抽样数据上验证，不在全量上运行。(2)订单500万/日——按 order_date 分区，增量同步昨日分区。(3)图片元数据10万/日——全量读取可行，但也做增量优化。(4)并行策略——订单和用户日志的探查和转换可完全并行；两者关联在转换完成后串行执行；3个汇总表的产出可并行。\n\n【Schema变更处理】：(1)每次管道启动前执行 schema_inspect 检查源schema是否变更；(2)若 SchemaChanged——暂停管道，比较新旧schema差异，自动适配兼容变更（新增可选字段、扩展字段长度）并记录；不兼容变更（删除字段、改类型）触发告警通知数据开发人员手动适配；(3)变更历史记录到审计日志。\n\n【数据质量策略】：(1)去重——按自然键（订单ID、用户ID+时间+事件类型）窗口去重，保留最新或第一条记录；(2)空值处理——关键字段（金额、订单ID）非空校验，非关键字段默认值填充或NULL标记；(3)格式标准化——日期统一ISO 8601、金额小数位统一、状态枚举值标准化；(4)延迟数据——设置watermark窗口（如允许延迟2小时），超窗数据写入补录表，下一批次自动合入。\n\n【测试失败诊断流程（pipeline_test失败时）】：(1)先看错误类型——TransformError→检查哪一步转换失败，定位具体输入行，验证转换逻辑是否覆盖该数据形态；(2)OutputSchemaMismatch→对比输出schema与目标表schema差异，调整转换字段映射；(3)Timeout→检查测试数据量是否过大，减少test_data规模重试，或增加管道超时配置；(4)TestFailed（通用）→查看管道的step级日志，精确定位失败步骤，逐步骤修复后重新pipeline_test。',
  },
  {
    id: 'agent-4',
    category: 'agent',
    question:
      '你是一个安全事件响应助手。当前情况：安全团队发现以下异常——\n\n' +
      '异常信息：\n' +
      '- 03:14 用户 admin_01 从 IP 203.0.113.42 登录了内网管理后台（该IP属于境外）\n' +
      '- 03:15-03:47 该账号执行了大量数据库查询，导出了约2GB数据\n' +
      '- 03:48 数据库CPU飙升至95%（当前时间 04:02）\n' +
      '- 03:52 另一个内部用户 dev_wang 从正常IP登录，但行为异常（访问了从未访问过的财务系统）\n\n' +
      '你的工具：\n' +
      '- ip_lookup(ip: string) → 查询IP地理位置和声誉。可能抛出：RateLimited、IPNotFound\n' +
      '- log_query(source: string, filter: string, time_range: string) → 查询日志。可能抛出：Timeout、SourceUnavailable、RateLimited\n' +
      '- account_action(account: string, action: "disable"|"force_logout"|"reset_mfa") → 账号操作。可能抛出：AccountNotFound、ActionFailed、PermissionDenied\n' +
      '- firewall_rule(action: "block"|"allow", target: string, direction: "inbound"|"outbound") → 防火墙操作。可能抛出：InvalidTarget、RuleConflict、RuleApplyFailed\n' +
      '- incident_create(title: string, severity: "low"|"medium"|"high"|"critical", details: string) → 创建事件工单。可能抛出：DuplicateIncident、ValidationError\n' +
      '- notify(recipient: string, message: string, urgency: "info"|"warning"|"critical") → 通知。可能抛出：RecipientNotFound、RateLimited\n\n' +
      '请提供完整的响应计划：\n' +
      '1. 按紧急度排序的前5个立即行动，每步包含：目的、工具、输入、如果工具失败的备选方案\n' +
      '2. 如何判断这是外部入侵还是内部人员作案还是账号被盗（区分依据和检查步骤）\n' +
      '3. 遏制策略：如何在不破坏取证证据的前提下阻止进一步损失\n' +
      '4. dev_wang 的异常行为是否相关？如何验证？\n' +
      '5. 如果 firewall_rule 执行失败，你的替代遏制方案\n' +
      '6. 取证保全：哪些日志和数据必须立即保存、如何保存',
    scoringRubric:
      '评估维度：\n' +
      '1) 紧急行动排序：首要是遏制（封IP、禁账号、断外联），再是取证——排序不合理扣2分\n' +
      '2) 入侵判断逻辑：境外IP→查是否有VPN/出差记录；admin_01→查是否本人操作时间/设备；dev_wang→查登录设备和历史模式——逻辑不完整扣2分\n' +
      '3) 取证保全：先取证再遏制（或至少同步进行），直接封禁导致日志丢失扣1.5分\n' +
      '4) dev_wang 关联分析：可能是横向移动（同一攻击者），也可能是独立事件——需查登录IP/设备/时间关联性，忽略扣1分\n' +
      '5) 备选遏制方案：防火墙失败→网络隔离、拔网线、路由黑洞、DNS切换——方案合理1分，无备选扣1分\n' +
      '6) 工具失败处理：每个行动都有备选方案，缺乏备选扣1分。累积扣至0分。',
    maxScore: 10,
    referenceAnswer: '安全事件响应计划（当前时间04:02，距首次异常48分钟，需争分夺秒）：\n\n【紧急行动TOP 5·按优先级排序】\n\n行动1·立即封禁攻击源IP（目的：阻止攻击者继续访问。优先级最高——每一秒都可能在持续外传数据）工具：firewall_rule(action: "block", target: "203.0.113.42", direction: "inbound")。正常输出：规则生效，该IP无法再访问任何内网服务。备选方案（若firewall_rule失败）：(a)RuleConflict→先查现有规则 firewall_rule(action: "allow", target: "203.0.113.0/24", direction: "inbound") 确认冲突规则，选择性覆盖；(b)RuleApplyFailed→立即执行行动2的同时联系网络运维手动在交换机/路由器ACL封禁；(c)备选遏制——在负载均衡层drop该来源IP流量。\n\n行动2·禁用被入侵账号（目的：切断攻击者通过admin_01的访问权限。与行动1并行执行，两者独立）工具：account_action(account: "admin_01", action: "force_logout") 立即踢出 → account_action(account: "admin_01", action: "disable") 禁用账号。正常输出：账号已强制登出并禁用。备选方案：(a)AccountNotFound→确认账号名是否完全匹配，用log_query搜索"admin_01"；(b)ActionFailed→联系IAM管理员手动在LDAP/AD中禁用；(c)PermissionDenied→立即通知权限管理员执行，同时notify通知安全负责人。\n\n行动3·取证保全——导出被入侵账号的完整操作日志（目的：在遏制前保留攻击行为的完整证据链，供后续溯源和司法用途。与行动1、2并行但需在账号被完全销毁前完成）工具：log_query(source: "admin-console", filter: "user=admin_01 OR ip=203.0.113.42", time_range: "2023-1-1T00:00:00Z/now")。正常输出：admin_01从首次异常登录到当前的所有操作记录（至少覆盖03:14之后）。同时并行执行：(a)log_query(source: "database-audit", filter: "user=admin_01", time_range: "2023-1-1T00:00:00Z/now") → 导出的2GB数据查询记录；(b)log_query(source: "network-firewall", filter: "src_ip=203.0.113.42", time_range: "2023-1-1T00:00:00Z/now") → 攻击者网络流量日志。以上3个查询并行。备选方案：(a)Timeout→缩小时间窗口分段查询；(b)SourceUnavailable→直接 ssh 到日志服务器手动导出；(c)RateLimited→先获取最关键的03:00-04:00时段日志。\n\n行动4·入侵判断分析（目的：判定攻击类型，指导后续处置）并行执行：\n(a) ip_lookup(ip: "203.0.113.42") → 确认IP归属地、ASN、是否有恶意情报标记。备选：IPNotFound→用search查询该IP的公开威胁情报。\n(b) log_query(source: "vpn-gateway", filter: "user=admin_01 AND time>=2023-03-14T03:00:00", time_range: "last 24 hours") → 确认攻击者是否通过VPN接入。\n(c) log_query(source: "admin-console", filter: "user=admin_01", time_range: "last 7 days") → 查看admin_01近7天的正常行为模式基线。\n(d) log_query(source: "hr-system", filter: "employee=admin_01", time_range: "last 30 days") → 查admin_01的出差记录/休假状态。\n以上4个并行。\n\n判断逻辑：(a)外部入侵——IP为境外恶意IP + admin_01非正常工作时间登录 + 设备指纹异常 + 无出差记录 → 高置信度外部入侵。(b)账号被盗——admin_01本人不在线 + IP异常 + dev_wang行为异常（可能是同一攻击者横向移动）→ 凭证泄露。(c)内部作案——admin_01确有出差/远程工作记录 + 行为模式部分符合工作内容（如数据分析）但对2GB导出无法合理解释 + dev_wang有前科或权限滥用史 → 内部威胁。\n\n行动5·创建事件工单并通知（目的：正式记录、启动响应流程、通知相关人员）工具：incident_create(title: "紧急：管理后台疑似外部入侵，admin_01账号从境外IP导出2GB数据", severity: "critical", details: "[汇总行动1-4的所有发现和时间线]")。正常输出：工单创建成功，获得incident ID。并行执行 notify(recipient: "security-oncall@company.com", message: "[CRITICAL] 安全事件 - admin_01账号境外入侵 " + "详情见工单[ID]", urgency: "critical") 和 notify(recipient: "cto@company.com", message: "紧急安全事件需知悉，详情待更新", urgency: "critical")。备选方案：DuplicateIncident→获取已有工单ID追加信息；RecipientNotFound→通过其他渠道（短信、电话、Slack紧急频道）通知。\n\n【dev_wang异常行为的关联分析】(1)先查登录信息：log_query(source: "admin-console", filter: "user=dev_wang AND time>=2023-03-14T03:52:00", time_range: "last 2 hours") → 确认登录IP、设备指纹、地理位置。(2)横向移动假设——如果 dev_wang 的登录IP与203.0.113.42相同或相近网段，则极可能是同一攻击者通过admin_01获取的凭据横向移动到dev_wang账号。(3)如果dev_wang IP正常（内网/正常办公IP）——可能是巧合（深夜加班），也可能是他的账号此前已被入侵，或者是攻击者通过admin_01在内部系统中修改了dev_wang的权限。(4)验证——查 dev_wang 近期的密码修改记录、MFA设备变更、是否有异常的API token创建 log_query(source: "iam-audit", filter: "user=dev_wang AND (action=password_change OR action=mfa_reset OR action=token_create)", time_range: "last 7 days")。(5)处置——如果关联确认，立即 disable dev_wang 账号（行动2同流程）；如果独立事件，单独调查。\n\n【遏制策略·在保护取证证据的前提下阻止损失】(1)网络层——firewall_rule封禁源IP（不影响日志记录），同时在出口防火墙监控该IP的出站流量，若已在内网建立持久化（后门），出站流量监控可以发现C2通信。(2)不破坏的证据——访问日志（在日志服务中，封禁IP不影响已有日志）、数据库审计日志（独立于数据库运行）、网络抓包（在防火墙上镜像流量到取证存储）。(3)如需更彻底的网络隔离——将受影响网段临时路由到黑洞路由而非直接断开，这样可以继续记录流量同时阻断通信。(4)数据库层——将被导出过的数据库设为只读（保留完整数据用于取证对比），同时创建副本用于业务恢复。\n\n【备用遏制方案（如果firewall_rule全部失败）】(1)网络层备用——联系IDC/云平台运维，在边界路由器上添加ACL规则 drop 203.0.113.42；(2)如果攻击者可能已在内网——临时将管理后台所在子网与其他子网隔离（VLAN隔离/安全组调整）；(3)DNS层——在内部DNS中将管理后台域名解析到告警页面（DNS重定向）阻止进一步访问；(4)最坏情况——物理断开受影响服务器的网络接口（保留本地日志和磁盘证据），在虚拟机环境暂停受影响VM并制作快照。\n\n【取证保全清单·必须立即保存的日志和数据】(1)管理后台Web访问日志（NGINX/Apache access log）——包含URL、参数、响应码、User-Agent；(2)数据库审计日志——所有查询语句、导出操作的时间戳和内容；(3)系统认证日志（auth.log/安全事件日志）——登录成功/失败记录；(4)admin_01的SSH/RDP会话记录（如有审计堡垒机）；(5)防火墙/IDS流量日志——203.0.113.42的完整会话流量；(6)所有受影响服务器的内存dump和磁盘快照。保存方式：(a)log_query导出到外部S3/对象存储（不可篡改）；(b)通过ssh_exec在服务器上执行 dd/tcpdump 并传输到取证服务器；(c)数据库审计日志立即导出并计算哈希值（SHA256）存证。',
  },
  {
    id: 'agent-5',
    category: 'agent',
    question:
      '你是一个多源信息整合助手，需要回答一个需要跨多个信息源验证的复杂问题。你的工具：\n\n' +
      '可用工具：\n' +
      '- search(query: string) → 网络搜索，返回前10条结果摘要。可能抛出：RateLimited（每分钟限5次）、NoResults、Timeout\n' +
      '- web_fetch(url: string) → 获取网页全文。可能抛出：UrlInvalid、ContentBlocked、Timeout（30s）、ContentSizeExceeded（>1MB）\n' +
      '- translate(text: string, from: string, to: string) → 翻译文本。可能抛出：LanguageNotSupported、TranslationFailed\n' +
      '- calculator(expr: string) → 计算。可能抛出：DivisionByZero、MathError\n' +
      '- cross_reference(claim: string, source1: string, source2: string) → 对比两个来源对同一说法的描述差异。可能抛出：SourceFormatError、InsufficientData\n\n' +
      '用户请求："我想了解全球锂矿资源的分布和供应链格局。具体来说：1）锂矿储量最大的5个国家及其储量；2）这些国家中哪些同时也是精炼锂的主要生产国；3）目前全球最大的3家锂业公司及其市占率；4）中国在全球锂供应链中的角色（矿石来源、精炼能力、电池制造）；5）锂供应链面临的主要地缘政治风险。请用中文回答，但信息源可能是英文的。"\n\n' +
      '请提供完整的信息收集计划：\n' +
      '1. 搜索策略：需要哪些搜索查询、查询顺序、如何利用搜索结果决定下一步\n' +
      '2. 如何验证储量/产量等数字数据的可靠性（多个来源交叉验证）\n' +
      '3. 如果搜索频率受限（每分钟5次），如何安排搜索顺序最大化效率\n' +
      '4. 遇到 NoResults 或 ContentBlocked 时的替代搜索策略\n' +
      '5. 如何处理不同来源数据不一致的情况\n' +
      '6. 最终回答如何标注每个信息点的来源和可信度',
    scoringRubric:
      '评估维度：\n' +
      '1) 搜索策略：从宏观搜索（全球锂矿储量/产量）到具体搜索（公司市占率、中国角色）递进，搜索词具体而非泛泛——策略不合理扣2分\n' +
      '2) 数据验证：使用 cross_reference 对比不同来源的数字，对差异大的数据增加额外搜索确认——无验证策略扣2分\n' +
      '3) 频率规划：先批量发出不依赖前序结果的搜索（如5个国家的储量可一次搜索），再根据结果决定后续搜索——未考虑频率限制扣1分\n' +
      '4) 降级策略：NoResults→换关键词/换语言搜索；ContentBlocked→换URL/搜索替代来源——缺少降级策略扣1分\n' +
      '5) 冲突处理：优先权威来源（USGS、国际能源署），标注差异，取多数一致值——无策略扣1分\n' +
      '6) 来源标注：每个数字/说法标注来源URL和可信度评级——未标注扣1.5分。累积扣至0分。',
    maxScore: 10,
    referenceAnswer: '信息收集计划（考虑每分钟5次搜索限制）：\n\n【第1轮搜索·第一分钟·宏观数据铺垫】（5个搜索全部并行发出，互不依赖）\n(1) search(query: "global lithium reserves by country 2024 USGS statistics") → 目标获取USGS等权威机构的全球锂矿储量统计。\n(2) search(query: "top lithium producing countries mining output 2024") → 获取各国锂矿开采产量排名。\n(3) search(query: "lithium refining capacity by country 2024 major producers") → 获取精炼锂产能分布。\n(4) search(query: "largest lithium mining companies market share 2024") → 获取头部锂业公司市占率。\n(5) search(query: "lithium supply chain geopolitics risks 2024") → 获取供应链地缘政治风险分析。\n正常输出：每个搜索返回最多10条结果摘要。错误恢复：(a)RateLimited→等待60s后重试；(b)NoResults→见降级策略；(c)Timeout→缩短查询词重试。\n\n【第2轮搜索·第二分钟·深入关键信息】（基于第1轮结果，按需调整查询词）\n假设第1轮得到关键发现（如澳大利亚、智利、中国是储量大国），则：\n(6) search(query: "Australia lithium reserves Greenbushes Pilgangoora 2024") → 针对澳大利亚深入。\n(7) search(query: "Chile lithium reserves Atacama SQM Albemarle 2024") → 针对智利深入。\n(8) search(query: "China lithium supply chain role processing capacity battery manufacturing 2024") → 中国角色专题。\n(9) search(query: "锂矿供应链 中国 碳酸锂 氢氧化锂 精炼产能 2024") → 中文搜索中国角色信息。\n(10) search(query: "Albemarle SQM Ganfeng market share lithium 2024") → 具体公司数据确认。\n\n【第3轮搜索·第三分钟·交叉验证】\n(11) search(query: "IEA lithium critical minerals outlook 2024") → 国际能源署报告作为权威验证源。\n(12) search(query: "lithium price forecast supply demand gap 2024") → 补充供需格局信息。\n(13) search(query: "lithium triangle Argentina Bolivia Chile policy risk 2024") → 锂三角区域政策风险。\n(14) cross_reference(claim: "全球最大的锂生产国", source1: "[第1轮来源1 URL]", source2: "[第1轮来源2 URL]") → 对比确认产量排名。\n(15) cross_reference(claim: "三大锂业公司市占率", source1: "[第1轮来源4 URL]", source2: "[第2轮来源10 URL]") → 对比公司数据。\n\n【并行策略与频率优化】：(a)第1轮5个搜索全部独立无依赖→并行发出；(b)第1轮结果返回后，基于结果规划第2轮——第2轮的5个搜索同样独立→并行发出；(c)同轮次的web_fetch可以与搜索并行（如已知关键URL）；(d)cross_reference必须等2个来源都获取后才能执行；(e)translate只在遇到英文内容且需要引用原文时执行，不消耗search配额。\n\n【NoResults降级策略】：(a)NoResults→换关键词：用同义词替代（如"reserves"换"deposits"/"resources"）、用更泛的查询（去掉年份、去掉具体术语）、用不同语言搜索（英文→中文或西班牙语 search(query: "reservas de litio mundiales por pais 2024")）；(b)仍NoResults→换搜索方向：不搜储量统计而搜行业报告（search(query: "lithium industry report 2024 PDF")），从报告中提取数据；(c)仍无结果→标记该信息点为"基于之前搜索结果推断/无独立验证源"，降低该信息点可信度评级。\n\n【ContentBlocked降级策略】：(a)ContentBlocked→先用 search(query: "[被block的网页标题或内容摘要]") 找其他网站引用了该内容的摘要——间接获取；(b)换web_fetch到替代来源（同一信息通常有多个网站报道）；(c)用URL的archive版本 web_fetch(url: "https://web.archive.org/web/2024/[原始URL]")；(d)ContentSizeExceeded→搜索该页面的子段落或只读取摘要部分。\n\n【数据不一致处理】：当cross_reference发现来源冲突时——(a)优先采用权威来源：USGS（美国地质调查局）> IEA（国际能源署）> 各国矿业部官方数据 > 行业报告（如Benchmark Mineral Intelligence）> 新闻报道；(b)对于储量数据：以USGS Mineral Commodity Summaries为基准，若其他来源差异>20%，标注差异并说明USGS数据作为权威参考；(c)对于市占率：以公司年报/路透数据为优先，新闻估算为次；(d)对于地缘政治风险：权衡多方观点，注明每个来源的立场（如中国来源可能低估中国风险，西方来源可能高估），给出综合判断。\n\n【最终回答的格式——来源标注与可信度评级】：\n每个信息点标注格式："[数据/说法]（[来源名称]，[URL]，可信度：[高/中/低]，依据：[如USGS官方数据/行业报告/新闻推测]）"\n\n可信度标准：\n- 高：来自USGS、IEA、各国政府矿业部门官网、经审计的公司年报，且被2个以上独立来源验证一致\n- 中：来自知名行业研究机构（Benchmark Mineral Intelligence、Roskill）、大型媒体（Reuters、Bloomberg），且数字与权威来源偏差<10%\n- 低：来自一般新闻网站、博客、未经验证的行业报告，或单一来源无法交叉验证\n\n回答结构：(1)锂矿储量TOP5国家表——国家名称 | 储量（万吨/百万吨 LCE）| 年份 | 来源 | 可信度；(2)精炼锂主要生产国对比表；(3)三大锂业公司及市占率——公司名 | 估计市占率 | 来源 | 可信度；(4)中国在全球锂供应链的角色——分3个维度（矿石来源、精炼能力、电池制造）逐一说明，每个维度标注来源；(5)地缘政治风险——按风险类型（资源民族主义、贸易壁垒、供应链集中度、ESG合规）分述，标注每个风险判断的来源。',
  },
  {
    id: 'agent-6',
    category: 'agent',
    question:
      '你是一个调试助手，需要诊断一个分布式系统的间歇性故障。你的工具：\n\n' +
      '可用工具：\n' +
      '- trace_query(trace_id: string) → 查询分布式追踪数据。可能抛出：TraceNotFound、TraceExpired（trace保存7天）、Timeout\n' +
      '- log_query(service: string, time_range: string, level?: string, filter?: string) → 查询服务日志。可能抛出：ServiceNotFound、RateLimited、LogStorageUnavailable\n' +
      '- metric_query(entity: string, metric_name: string, time_range: string, aggregation?: string) → 查询指标。可能抛出：EntityNotFound、MetricNotFound、Timeout\n' +
      '- config_get(service: string, key?: string) → 获取服务配置。可能抛出：ServiceNotFound、KeyNotFound、PermissionDenied\n' +
      '- dependency_map(service: string) → 获取服务依赖关系图。可能抛出：ServiceNotFound、MapUnavailable\n\n' +
      '故障现象：电商系统的"下单"功能间歇性失败，大约每100次请求失败3-5次。失败时返回500错误，但重试通常成功。故障从上周开始出现，没有发布新版本。系统包含：gateway → order-service → inventory-service → payment-service → notification-service。\n\n' +
      '请提供完整的调试计划：\n' +
      '1. 如何获取一个失败请求的 trace_id（前提是你没有现成的trace_id）\n' +
      '2. 获取 trace 后的分析步骤——重点关注什么\n' +
      '3. 间歇性故障的常见根因假设列表（至少5个）及针对每个假设的验证方法\n' +
      '4. 如何区分"下游服务偶发超时"vs"网络抖动"vs"资源竞争"vs"数据竞争"这4类问题\n' +
      '5. 如果 trace 数据已过期（TraceExpired），如何用日志和指标替代追踪来定位\n' +
      '6. "上周开始"这个时间线索如何利用',
    scoringRubric:
      '评估维度：\n' +
      '1) 获取trace_id：应先查日志找失败的request_id再映射到trace_id，或查metric定位失败时段再查该时段trace——方法不合理扣1.5分\n' +
      '2) Trace分析重点：关注耗时最长的span、重试span、错误span——重点错误扣1分\n' +
      '3) 假设丰富度：至少5个合理假设（连接池耗尽、GC暂停、数据库锁竞争、缓存雪崩、下游服务限流等），每个有验证方法——少一个假设扣0.5分\n' +
      '4) 区分4类问题：超时→查下游响应时间分布；网络→查重传率/连接重置；资源→查CPU/内存/线程池；数据竞争→查并发量和错误率的关联——区分方法不清晰扣2分\n' +
      '5) Trace过期替代方案：用日志中的request_id串联+指标趋势分析+config_get检查变更——替代方案不足扣1分\n' +
      '6) 时间线索利用：对比故障前后一周的config变更、流量模式、基础设施事件——未利用扣1分。累积扣至0分。',
    maxScore: 10,
    referenceAnswer: '调试计划：\n\n【步骤1·获取失败请求的trace_id】由于没有现成的trace_id，分三步获取：(1)先从gateway日志中搜索最近失败的500错误请求——log_query(service: "gateway", time_range: "last 1 hour", filter: "status=500 AND path=\"/order\" OR path=\"/checkout\"")，正常输出返回包含request_id和timestamp的失败请求日志。(2)对返回的request_id，用它再次查询gateway日志看是否包含trace_id字段——log_query(service: "gateway", time_range: "last 1 hour", filter: "request_id=[上一步获取的ID] AND trace_id")。(3)若gateway日志不含trace_id（各公司实现不同），则用request_id在order-service日志中反查——log_query(service: "order-service", time_range: "last 1 hour", filter: "[request_id]")，order-service日志通常包含下游传播的trace_id。备选：(4)若以上均无trace_id——用metric_query查最近1小时的错误率峰值时段，缩小时间窗口后用log_query批量导出该时段所有>=500错误的日志，从中提取request_id集合，再逐一反查。错误恢复：ServiceNotFound→确认服务名是否匹配部署环境；LogStorageUnavailable→用ssh_exec直接到网关服务器查access日志。\n\n【步骤2·Trace分析——获取后重点看什么】假设取得trace_id，执行trace_query(trace_id: "[获取的ID]")。分析重点：(1)总耗时分解——哪个span占据最大耗时比例？(2)失败span——哪个span返回error？（重点关注order-service→inventory-service的调用、order-service→payment-service的调用）(3)重试span——同一操作是否有重试span？重试了几次才成功/失败？(4)时间相关性——是否在特定时间点（如整点、高峰时段）一致出现？(5)下游服务响应码——是下游返回500还是timeout？错误恢复：(a)TraceExpired→见步骤5替代方案；(b)TraceNotFound→扩大搜索范围，多找几个失败的request_id逐一尝试；(c)Timeout→缩小trace的水印时间范围。\n\n【步骤3·5+根因假设与验证方法】\n\n假设1·数据库连接池耗尽——下单需要多次DB调用，连接池用尽时新请求等待获取连接→超时500。验证：(a)metric_query(entity: "order-service", metric_name: "db_connection_pool_active", time_range: "last 1 hour") 和 "db_connection_pool_pending"；(b)log_query(service: "order-service", time_range: "last 1 hour", filter: "ConnectionPoolTimeout OR CannotGetConnection OR too many connections")；(c)ssh_exec(host: "db-primary", command: "mysql -e \"SHOW PROCESSLIST\" | wc -l") 查当前连接数是否接近max_connections。若确认→增大连接池 size 或优化连接释放。\n\n假设2·数据库行锁/死锁——高并发下单时同一商品库存行锁等待，锁超时导致500。验证：(a)log_query(service: "order-service", time_range: "last 1 hour", filter: "Deadlock OR LockTimeout OR Lock wait timeout")；(b)metric_query(entity: "db-primary", metric_name: "row_lock_waits", time_range: "last 1 hour")；(c)ssh_exec(host: "db-primary", command: "mysql -e \"SHOW ENGINE INNODB STATUS\\G\" | grep -A20 \"LATEST DETECTED DEADLOCK\"")。若确认→优化库存扣减的事务隔离级别或改用乐观锁。\n\n假设3·下游服务偶发超时——inventory-service或payment-service偶尔响应>5s，order-service超时断开返回500。验证：(a)用trace中的下游调用span时间分析——取多个失败trace，对比下游响应时间分布；(b)metric_query(entity: "inventory-service", metric_name: "p99_latency", time_range: "last 1 hour")；(c)metric_query(entity: "payment-service", metric_name: "p99_latency", time_range: "last 1 hour")；(d)log_query(service: "order-service", time_range: "last 1 hour", filter: "ReadTimeout OR ConnectTimeout OR upstream timeout")。若确认→增大order-service对下游的超时阈值或加熔断重试。\n\n假设4·JVM GC暂停——Full GC时STW（Stop-The-World）导致所有请求堆积，暂停结束后一批请求同时超时。验证：(a)metric_query(entity: "order-service", metric_name: "jvm_gc_pause_time", time_range: "last 1 hour", aggregation: "max")；(b)log_query(service: "order-service", time_range: "last 1 hour", filter: "Full GC OR GC overhead")；(c)ssh_exec(host: "order-service-01", command: "jstat -gcutil $(pgrep -f order-service) 1000 5") 查看实时GC情况。若确认→调整JVM堆大小或GC策略。\n\n假设5·缓存雪崩/缓存失效——某个热点数据缓存集中过期，大量请求穿透缓存打到数据库，数据库扛不住导致超时。验证：(a)metric_query(entity: "redis-primary", metric_name: "evicted_keys_rate", time_range: "last 1 hour")；(b)metric_query(entity: "redis-primary", metric_name: "cache_miss_rate", time_range: "last 1 hour")；(c)metric_query(entity: "db-primary", metric_name: "qps", time_range: "last 1 hour") 看DB的QPS是否有突刺与缓存miss率正相关。若确认→做缓存预热、加随机过期TTL（避免雪崩）、加二级缓存。\n\n假设6·下游限流——inventory-service或payment-service有QPS限制，超出限制返回429或拒绝连接，order-service将此转译为500。验证：(a)metric_query(entity: "inventory-service", metric_name: "throttled_requests", time_range: "last 1 hour")；(b)metric_query(entity: "payment-service", metric_name: "rate_limit_exceeded", time_range: "last 1 hour")；(c)log_query(service: "order-service", time_range: "last 1 hour", filter: "429 OR Too Many Requests OR rate limit")。若确认→调整限流阈值或order-service加入排队/背压机制。\n\n假设7·配置变更或环境变化——虽然没有发布新版本，但可能有配置热更新、DNS变更、证书过期等。验证：(a)config_get(service: "order-service") → 对比上周配置快照看是否有变更；(b)config_get(service: "inventory-service")；(c)config_get(service: "payment-service")；(d)metric_query(entity: "order-service", metric_name: "config_change_events", time_range: "last 7 days")看是否有自动配置变更记录。若确认→回滚对应的配置变更。\n\n【步骤4·区分4类问题的具体方法】\n\n区分"下游超时"vs"网络抖动"：\n- 下游超时特征——trace中下游span的耗时接近或达到设定的timeout阈值（如5000ms），且下游服务自身的metric显示P99延迟升高。\n- 网络抖动特征——trace中下游span耗时分布不均匀（不是渐进升高，而是偶发突刺），metric_query查tcp_retransmit_rate(host: "order-service-01", metric_name: "tcp_retransmit", time_range: "last 1 hour") >5%，ssh_exec(host: "order-service-01", command: "ss -s | grep retrans")查看TCP重传统计。\n\n区分"资源竞争"vs"数据竞争"：\n- 资源竞争特征——CPU/内存/线程池/连接池等指标在故障时刻达到瓶颈，且故障频率与负载正相关（QPS越高，失败率越高）。用metric_query查资源使用率与错误率的spearman相关系数。\n- 数据竞争特征——错误与特定数据有关（如特定商品下单总是失败、特定用户ID总是失败），并发量不一定高但错误集中在特定数据行。用log_query筛选失败请求的请求参数，分析是否有数据维度聚集性。\n\n【步骤5·TraceExpired替代方案】如果trace数据已过期（超过7天）但故障仍在发生：(1)用log_query获取最近失败请求的request_id→以此为线索，在每个服务的日志中分别搜索该request_id（模拟trace的span串联）：log_query(service: "gateway", time_range: "last 1 hour", filter: "[request_id]") → log_query(service: "order-service", time_range: "last 1 hour", filter: "[request_id]") → log_query(service: "inventory-service", time_range: "last 1 hour", filter: "[request_id]") → log_query(service: "payment-service", time_range: "last 1 hour", filter: "[request_id]")，通过日志时间戳重建请求链路。(2)用指标趋势分析——metric_query(entity: "order-service", metric_name: "p99_latency", time_range: "last 7 days", aggregation: "1h_avg") 看过去一周的延迟趋势变化，找出恶化开始的具体时间点。(3)用config_get查各个服务的近7天配置变更记录，看故障开始时间是否与某配置变更吻合。(4)用dependency_map(service: "order-service") 获取全链路依赖关系图，确保没有遗漏任何下游节点。\n\n【步骤6·"上周开始"时间线索的利用】(1)设定故障开始的具体日期（如今天周三，上周=约7天前），用metric_query拉取该日期前后各3天的延迟/错误率/流量趋势对比——metric_query(entity: "order-service", metric_name: "error_rate", time_range: "last 14 days", aggregation: "1d_avg")，确认"上周哪天"开始恶化。(2)用config_get检查所有相关服务（gateway、order、inventory、payment、notification）在故障日期前后48小时内的配置变更记录。(3)用log_query查故障日期前后48小时的deploy日志——log_query(service: "infrastructure", time_range: "last 14 days", filter: "deploy OR upgrade OR restart OR scale")。(4)查外部依赖变更——DNS记录变更、第三方API版本升级、SSL证书更换等时间点与故障开始时间匹配。(5)对比上周同期的流量模式——metric_query(entity: "order-service", metric_name: "qps", time_range: "14 days ago", aggregation: "1h_avg") 和 metric_query(entity: "order-service", metric_name: "qps", time_range: "last 7 days", aggregation: "1h_avg") 对比，看是否有流量模式变化。',
  },
  {
    id: 'agent-7',
    category: 'agent',
    question:
      '你是一个迁移规划助手，需要制定将一个单体应用拆分为微服务的迁移计划。你的工具：\n\n' +
      '可用工具：\n' +
      '- code_analyze(repo: string, analysis_type: "dependencies"|"call_graph"|"module_size"|"shared_state") → 分析代码库。可能抛出：RepoNotFound、AnalysisTimeout、InsufficientAccess\n' +
      '- load_test(target: string, scenario: string, duration: string) → 执行负载测试。可能抛出：TargetUnavailable、ScenarioInvalid、TestAborted\n' +
      '- deploy(service: string, version: string, strategy: "blue-green"|"canary"|"rolling") → 部署服务。可能抛出：VersionNotFound、HealthCheckFailed、RollbackTriggered、InsufficientResources\n' +
      '- traffic_shift(from: string, to: string, percentage: number) → 流量切换。可能抛出：ServiceNotFound、InvalidPercentage、ShiftFailed\n' +
      '- rollback(deployment_id: string) → 回滚部署。可能抛出：DeploymentNotFound、RollbackFailed、StateCorrupted\n' +
      '- monitoring_dashboard(service: string, metrics: string[]) → 创建监控面板。可能抛出：ServiceNotFound、MetricUnavailable\n\n' +
      '背景：一个电商单体应用（Java/Spring），包含用户管理、商品目录、购物车、订单、支付、库存、通知7个模块，约50万行代码，日活100万用户。所有模块共享一个MySQL数据库。\n\n' +
      '请提供完整的迁移计划：\n' +
      '1. 拆分顺序及理由（哪些模块先拆、哪些后拆，依赖关系如何决定顺序）\n' +
      '2. 每个模块拆分的具体步骤（使用上述工具，包含部署策略和回滚预案）\n' +
      '3. 数据库拆分策略——如何处理共享数据库的解耦\n' +
      '4. 如何在迁移过程中保持单体和微服务双跑（数据一致性保障）\n' +
      '5. canary 发布时流量比例如何递进、监控什么指标、什么条件触发回滚\n' +
      '6. 如果 code_analyze 返回 InsufficientAccess，你的替代分析方案\n' +
      '7. 完整的风险评估和缓解措施',
    scoringRubric:
      '评估维度：\n' +
      '1) 拆分顺序：应先拆独立性强的（如通知服务），再拆核心但低耦合的（商品目录），最后拆高耦合核心的（订单/支付）——顺序不合理扣2分\n' +
      '2) 每模块步骤：分析依赖→拆分代码→独立部署→canary切流→全量→监控，缺步骤扣1分\n' +
      '3) 数据库拆分：先逻辑分离（每个微服务用自己的schema）→再物理分离→数据同步（CDC/双写）——策略不完整扣2分\n' +
      '4) 双跑保障：事件驱动同步、saga模式、最终一致性策略——缺少数据一致性方案扣1.5分\n' +
      '5) Canary策略：1%→5%→25%→50%→100%，监控P99延迟/错误率/QPS，错误率翻倍触发回滚——不合理扣1分\n' +
      '6) InsufficientAccess替代：用log/metric分析调用模式、人工代码审查、渐进式探查——缺少方案扣1分\n' +
      '7) 风险评估：列出关键风险（数据丢失、服务中断、性能退化）及缓解措施——不完整扣1分。累积扣至0分。',
    maxScore: 10,
    referenceAnswer: '迁移计划：\n\n【拆分顺序及理由·基于依赖关系和耦合度分析】\n\n第一阶段·先行拆分（低依赖、独立性强）：\n(1) 通知服务——对其他模块几乎无依赖（只被调用不依赖别人），接口简单（发送邮件/短信/推送）。先拆它建立微服务化流程模板，团队积累经验，风险最低。\n(2) 商品目录——核心数据但逻辑相对独立（CRUD为主），被购物车和订单依赖但可作为只读服务先行拆分。对外提供产品信息查询API即可。\n\n第二阶段·中等拆分（有依赖但耦合可控）：\n(3) 用户管理——认证/授权是横切关注点，但逻辑集中。先拆出独立用户服务（含SSO），其他服务通过 Token/JWT 获取用户信息。需先解决共享Session问题。\n(4) 库存服务——与订单强耦合（下单扣库存），但逻辑清晰（CRUD + 乐观锁/悲观锁扣减）。拆出后订单服务通过API调用扣库存，同步改异步（消息队列）降低耦合。\n(5) 购物车——依赖商品目录和用户管理，逻辑简单（增删改查），独立部署后可通过用户ID关联。\n\n第三阶段·核心拆分（高耦合、高复杂度）：\n(6) 订单服务——最复杂模块，依赖用户、商品、购物车、支付、库存。在上面5个服务稳定运行后再拆，此时所有依赖项已为独立服务。风险最高，放在最后。\n(7) 支付服务——依赖订单和用户，涉及外部支付网关对接。与订单紧密耦合，可在订单拆分后紧随进行（或与订单同步进行）。\n\n并行可能性：通知和商品目录可并行开始；用户管理、库存、购物车可在第二阶段并行推进；订单和支付在第三阶段串行（因为支付依赖订单的最终接口）。\n\n【每模块拆分步骤·以订单服务为例】\n\n步骤1·代码分析：code_analyze(repo: "order-module", analysis_type: "dependencies") → 获取订单模块的内部依赖列表（import/调用关系）；code_analyze(repo: "order-module", analysis_type: "call_graph") → 获取运行时调用图，识别外部的调用者和被调用者；code_analyze(repo: "order-module", analysis_type: "shared_state") → 识别共享的静态变量/全局状态/ThreadLocal/in-memory cache。以上3个分析可并行。错误恢复：(a)AnalysisTimeout→缩小分析的代码范围（只分析订单微服务的包路径）；(b)InsufficientAccess→见第6部分替代方案。\n\n步骤2·代码拆分：根据步骤1结果，创建独立代码仓库，迁移代码、剥离共享依赖。确保接口使用HTTP/REST或gRPC替代原先的方法调用。\n\n步骤3·数据库分离：为订单服务创建独立schema（order_schema），将订单相关表迁移。原单体数据库中的订单表保留为视图代理过渡期。\n\n步骤4·独立部署与负载测试：deploy(service: "order-service", version: "v1.0-migration", strategy: "blue-green") → 蓝绿部署独立实例。然后 load_test(target: "order-service", scenario: "下单-峰值流量", duration: "10m") → 验证独立部署的性能和正确性。错误恢复：(a)VersionNotFound→确认版本号打tag正确；(b)HealthCheckFailed→查order-service的健康检查日志（可能数据库连接未就绪）；(c)TestAborted→检查负载生成器资源是否充足。\n\n步骤5·Canary切流：traffic_shift(from: "monolith-order-api", to: "order-service", percentage: 1) → 初始1%流量。监控：monitoring_dashboard(service: "order-service", metrics: ["p99_latency", "error_rate", "qps", "cpu_usage", "memory_usage", "db_connection_count", "circuit_breaker_state"])。\n\n步骤6·Canary递进（每阶段观察10分钟）：1%确认无异常→ traffic_shift(to: "order-service", percentage: 5) → 5%→ traffic_shift(to: "order-service", percentage: 25) → 25%→ traffic_shift(to: "order-service", percentage: 50) → 流量50%→ traffic_shift(to: "order-service", percentage: 100)。每阶段监控：(a)P99延迟超过单体基线1.5倍→暂停递进；(b)错误率超过单体基线2倍→触发回滚；(c)QPS低于单体基线80%→暂停递进排查；(d)数据库连接数接近上限→扩容或优化。\n\n步骤7·回滚预案：任一阶段触发回滚条件→rollback(deployment_id: "[步骤4的deployment ID]") → 确认流量100%回到单体后，排查微服务问题再重新部署。错误恢复：(a)DeploymentNotFound→手动traffic_shift切回100%单体；(b)RollbackFailed→启用blue-green中保留的旧版本green环境手工接管流量；(c)StateCorrupted→从数据库备份恢复。\n\n【数据库拆分策略】\n\n阶段A·逻辑分离：(1)为每个微服务创建独立schema（user_schema, order_schema, payment_schema等），在MySQL中设置跨schema访问权限；(2)原单体表保留，新增微服务专用表，通过数据库视图(VIEW)桥接过渡；(3)在应用层通过配置切换：读新schema写新schema，同时双写到单体表（过渡期）。\n\n阶段B·物理分离：(1)逐步将各schema迁移到独立的数据库实例（RDS实例）；(2)通过CDC（Change Data Capture，如Debezium+Canal）实时同步变更数据；(3)单体表和微服务表之间通过CDC保持最终一致性，延迟<1秒。\n\n阶段C·最终一致性：(1)跨服务数据通过事件驱动同步——订单创建后发出OrderCreated事件，库存服务消费后扣减库存；(2)实施Saga模式处理分布式事务——订单创建→扣库存（失败则补偿撤单）→扣款（失败则补偿恢复库存+撤单）；(3)设计幂等性接口——每个事件有唯一ID，消费端通过ID去重。\n\n【双跑数据一致性保障】：(1)过渡期双写——订单同时写入单体和微服务数据库，一致性校验脚本每日运行对比差异；(2)差异处理——以微服务数据为准（因为业务最终将完全迁移至微服务），差异记录到补偿队列自动修复；(3)读流量——初期读仍走单体（稳定），逐步将读流量切到微服务后对比响应差异。\n\n【Canary递进与回滚触发条件】：\n- 1%→5%：P99延迟<基线1.2倍且错误率<基线1.5倍→递进\n- 5%→25%：P99延迟<基线1.3倍且错误率<基线1.5倍且数据库负载<80%→递进\n- 25%→50%：连续10分钟无P1告警且所有健康检查通过→递进\n- 50%→100%：完整业务验收通过（订单创建→支付→库存扣减→通知全链路）→递进\n- 触发回滚条件：错误率>基线2倍持续2分钟；P99延迟>基线2倍持续3分钟；数据库连接池耗尽；出现数据一致性问题（双写差异>0.1%）。\n\n【InsufficientAccess替代分析方案】：如果code_analyze返回InsufficientAccess（无法分析代码仓）：(1)通过监控数据反向推导调用关系——metric_query查每个模块的调用量和调用方（如果监控系统有调用链路数据）；(2)通过日志分析——log_query(service: "monolith", time_range: "last 24 hours", filter: "class=*OrderService OR class=*PaymentService") 分析各类的实际调用模式；(3)人工程序分析——请对应模块的开发人员手动梳理依赖关系，输出依赖矩阵文档；(4)渐进式探查——先拆分最外层模块（如通知服务），观察单体中调用该模块的代码在编译/运行时是否报错，逐步发现隐藏依赖。\n\n【风险评估与缓解措施】\n\n风险1·数据一致性破坏：双写or分布式事务失败导致库存多卖/少卖。缓解：实施Saga补偿机制，每日自动对账脚本，差异告警+人工介入。\n\n风险2·服务中断：部署或切流时系统不可用。缓解：蓝绿部署保持旧版本在线上，流量切换渐进（1%起步），每个阶段可秒级回滚。\n\n风险3·性能退化：网络调用开销>方法调用开销，延迟增加。缓解：canary阶段严格监控P99对比，部署本地缓存减少跨服务调用，gRPC替代REST减少序列化开销。\n\n风险4·拆分后调试困难：分布式链路追踪缺失导致故障定位慢。缓解：在拆分前先集成分布式追踪（如Jaeger/Zipkin），确保trace_id在微服务和单体间传递。\n\n风险5·数据库迁移导致数据丢失。缓解：迁移前全量备份+增量CDC双跑，迁移后保留原表30天，验证脚本每日运行确认数据完整性。\n\n风险6·团队能力不足：团队缺乏微服务运维经验。缓解：先拆分最简单的通知服务积累经验，建立运维playbook和runbook后再拆核心模块。\n\n风险7·配置漂移：微服务和单体间的功能差异导致用户体验不一致。缓解：API契约测试+端到端自动化测试覆盖核心业务场景，集成测试在CI/CD门禁中强制执行。',
  },
  {
    id: 'agent-8',
    category: 'agent',
    question:
      '你是一个决策助手，需要在一个信息不完整、约束互相冲突的场景下做出最优策略。你的工具：\n\n' +
      '可用工具：\n' +
      '- search(query: string) → 搜索信息。可能抛出：RateLimited、NoResults、Timeout\n' +
      '- simulate(scenario: object) → 模拟场景执行，返回可能结果和概率分布。可能抛出：InvalidScenario、SimulationDiverged、Timeout\n' +
      '- optimize(objective: string, constraints: string[], variables: string[]) → 约束优化求解。可能抛出：Infeasible（约束不可满足）、Unbounded、SolverTimeout\n' +
      '- risk_assess(action: string, context: string) → 评估行动风险。可能抛出：InsufficientContext、ModelUncertain（置信度<60%）\n\n' +
      '场景：你是一家新能源公司的战略规划AI。公司有5亿预算，需在以下方向分配投资：\n' +
      '- A: 固态电池研发（高风险高回报，成功概率约30%，成功收益5倍，失败则投资归零）\n' +
      '- B: 锂矿开采权收购（中风险，市场需求波动大，政策风险高）\n' +
      '- C: 充电桩网络扩建（低风险低回报，稳定现金流，但政府补贴政策明年可能取消）\n' +
      '- D: 钠离子电池中试产线（中等风险，技术成熟度不确定，但原材料成本低）\n' +
      '- E: 储能系统集成（市场需求确定但竞争激烈，需评估差异化可行性）\n\n' +
      '约束条件：\n' +
      '1. 董事会要求：任何单一方向投资不超过2亿\n' +
      '2. CFO要求：最坏情况下总损失不超过3亿\n' +
      '3. CTO要求：至少1亿投入前沿技术（A或D）\n' +
      '4. 市场部要求：C和E合计至少1.5亿（面向客户的项目）\n' +
      '5. 合规要求：B国最近出台了外资矿业限制，需评估政策风险后再决定\n\n' +
      '请提供：\n' +
      '1. 完整的决策流程：先做什么、后做什么、每步使用什么工具\n' +
      '2. 如何处理约束冲突（如约束1-5可能不可同时满足）\n' +
      '3. 如果 optimize 返回 Infeasible，你如何调整约束优先级\n' +
      '4. 如果 risk_assess 返回 ModelUncertain，你如何在这种情况下做决策\n' +
      '5. 对每个方向的具体投资金额建议和理由\n' +
      '6. 敏感性分析：哪些假设如果变化会显著改变推荐方案',
    scoringRubric:
      '评估维度：\n' +
      '1) 决策流程：先搜索补充信息（B国政策、技术进展）→风险评估→模拟→优化求解——流程混乱扣2分\n' +
      '2) 约束冲突处理：识别冲突（如最坏损失3亿+前沿≥1亿+单项目≤2亿可能冲突），提出约束优先级排序和妥协方案——未识别冲突扣1.5分\n' +
      '3) Infeasible处理：放松低优先级约束（如调整最坏损失上限），重新求解——缺少松弛策略扣1分\n' +
      '4) 不确定性决策：使用最大最小准则、鲁棒优化、或情景分析——缺少方法论扣1分\n' +
      '5) 投资建议：金额+理由+与约束的满足关系——建议与约束矛盾扣2分，缺乏理由扣1分\n' +
      '6) 敏感性分析：固态电池成功概率变化、B国政策走向、补贴取消等关键假设变化的影响——缺少扣1分。累积扣至0分。',
    maxScore: 10,
    referenceAnswer: '决策流程（4阶段有序执行）：\n\n【阶段1·信息收集——填补不确定性】目的：在优化前收集B国政策、技术进展、市场需求等不完整信息，降低后续风险评估的不确定性。工具：search（5个搜索可并行发出）：\n(1) search(query: "锂矿外资限制政策 2024 2025 最新法规 B国") → 了解B国矿业政策最新动态和外资准入条件。\n(2) search(query: "固态电池研发进展 2024 2025 技术成熟度 商业化预期") → 了解A方向（固态电池）的实际技术成熟度和各家进度。\n(3) search(query: "钠离子电池 中试产线 2024 宁德时代 中科海钠 量产进展") → 了解D方向（钠离子电池）的技术成熟度和竞争格局。\n(4) search(query: "充电桩补贴政策 新能源 取消 2025 2026") → 了解C方向补贴政策的变动可能性和时间表。\n(5) search(query: "储能系统集成 市场竞争格局 差异化 2024 2025 价格战") → 了解E方向市场需求和竞争态势。\n正常输出：各方向的市场/技术/政策信息摘要。错误恢复：RateLimited→优先搜B国政策和固态电池（不确定性最大），等待1分钟后搜剩余3个；NoResults→缩小搜索词或搜索英文对应关键词。\n\n【阶段2·风险评估】目的：基于阶段1获得的信息，对每个投资方向进行风险量化。5个方向评估（由于工具只支持单个action，需串行执行但互不依赖）：\n(a) risk_assess(action: "投资固态电池研发", context: "[阶段1搜索结果摘要：技术进展、各家进度、成功案例]")。\n(b) risk_assess(action: "收购B国锂矿开采权", context: "[阶段1搜索结果：B国最新政策、外资限制、政局稳定性]")。\n(c) risk_assess(action: "扩建充电桩网络", context: "[阶段1搜索结果：补贴政策走向、市场增速、竞争对手布局]")。\n(d) risk_assess(action: "建设钠离子电池中试产线", context: "[阶段1搜索结果：技术成熟度、原材料供应链、竞争厂商进度]")。\n(e) risk_assess(action: "投资储能系统集成", context: "[阶段1搜索结果：市场规模、竞争格局、差异化空间]")。\n错误恢复：(a)InsufficientContext→补充更多信息后重试（针对信息量最少的维度再做一轮search）；(b)ModelUncertain→见阶段4不确定性决策。\n\n【阶段3·约束优化求解】目的：在满足所有约束条件下求解最优投资组合。依赖：阶段2的风险评估结果。\n工具：optimize(objective: "最大化预期收益（收益×概率 - 风险调整），同时考虑长期战略价值", constraints: ["x_A + x_B + x_C + x_D + x_E = 5", "x_A <= 2", "x_B <= 2", "x_C <= 2", "x_D <= 2", "x_E <= 2", "max(0, max_loss(A) + max_loss(B) + max_loss(C) + max_loss(D) + max_loss(E) - min(guaranteed_return(C), guaranteed_return(E))) <= 3", "x_A + x_D >= 1", "x_C + x_E >= 1.5", "x_B > 0 → B国政策风险评估为可接受"], variables: ["x_A", "x_B", "x_C", "x_D", "x_E"])。\n正常输出：满足所有约束的最优投资金额分配。\n错误恢复：\n- Infeasible（约束不可满足）→进入约束冲突处理流程（见下文）。\n- Unbounded→添加额外的实际约束（如投资下限、整数限制）重新求解。\n- SolverTimeout→降低搜索精度或放宽部分约束重新求解。\n\n【约束冲突处理】：关键冲突识别——(1)最坏损失≤3亿 与 前沿技术≥1亿 + 单项目≤2亿 → 如果A失败归零且B也亏损，最坏损失可能超3亿（因为A失败损失最多2亿，B亏损可能1-2亿）→这是一个实际不冲突但需谨慎平衡的约束。(2)客户项目C+E≥1.5亿 与 前沿技术A+D≥1亿 可能争夺有限预算。(3)真正的硬冲突可能出现在B包括在组合中且政策风险高且B的投资额度大时。\n\n【Infeasible处理——约束松弛优先级】：如果optimize返回Infeasible，按以下优先级放松约束：(1)首先放松最坏损失上限（从3亿放松到3.5亿）——这是软性风险偏好约束；(2)其次调整市场部客户项目门槛（从1.5亿降到1.2亿）——这是商业决策而非刚性合规；(3)再次检查是否需要同时满足A+D≥1亿（如果D方向风险太高则重新评估）；(4)最后才考虑放松单项目≤2亿的上限（董事会决策，最刚性）；(5)每次放松一个约束后重新optimize，直到找到可行解。约束刚性排序：合规要求（外资矿业政策）> 董事会金额上限(2亿) > CTO前沿技术(1亿) > CFO最坏损失(3亿) > 市场部客户项目(1.5亿)。\n\n【ModelUncertain决策方法论】：当risk_assess返回ModelUncertain（置信度<60%）时，采用以下决策框架：(1)最大最小准则（Maximin）——对每个方案计算最坏情况下的收益，选择最坏收益最大的方案。如对A（固态电池）最坏为损失全部投入(-2亿)、B（锂矿）最坏为政策风险导致收购无法运营（-1.5亿）、C（充电桩）最坏为补贴取消后现金流下降50%（仍无净损失），选择最坏损失最小的组合。(2)鲁棒优化——不只依赖单一概率估计（如A成功30%），而是考虑概率范围（20%-40%）做敏感性优化，选择在概率波动下仍稳健的方案。(3)情景分析——构建3个情景：乐观（政策有利+技术突破）、基准（中性）、悲观（政策收紧+技术延期），计算每个情景下各方案回报，选择三情景下表现最均衡的组合。(4)实物期权思维——优先投入可分期/可退出的方向（如E储能系统可分批投入，前半年验证后决定是否继续），对不可逆的大额投资（如B矿业收购）在信息不足时暂缓或最小额投入。\n\n【具体投资金额建议与理由】：\n\n建议分配方案：\n- A·固态电池研发：1.2亿。理由：满足CTO"前沿技术≥1亿"要求的最低额，30%成功率虽低但一旦成功回报5倍（预期回报1.2×0.3×5=1.8亿 vs 投入1.2亿，正期望）。投入控制在2亿上限以内且留有灵活性。其中6000万用于实验室阶段研发，6000万基于阶段性gate（达到技术里程碑后释放）。\n- B·锂矿开采权：0.8亿（如政策风险评估可接受，否则0）。理由：政策风险是最大不确定性，先投入0.8亿做小规模参股或预可研，而非全资收购。如果阶段1搜索发现政策严重不利→投资降为0，资金转配到C/E。\n- C·充电桩网络：1.0亿。理由：低风险稳定现金流，即使补贴2025年取消，已建成的充电桩仍可持续产生收入（资产型收入），且新能源车保有量增长确定（充电需求刚性）。与客户项目方向匹配。\n- D·钠离子电池中试产线：1.0亿。理由：技术成熟度不确定但原材料成本低（钠资源丰富），中试产线而非大规模量产→投入可控。与A同为前沿技术（合计2.2亿>1亿满足CTO要求）。中试成功后可快速复制量产（正路战略）。\n- E·储能系统集成：1.0亿。理由：市场需求确定（新能源配储刚性），竞争激烈要求差异化（如专做工商业储能细分赛道、虚拟电厂聚合运营）。与C合计2.0亿>1.5亿满足市场部要求。\n\n总计：1.2+0.8+1.0+1.0+1.0=5.0亿，每个单项目≤2亿✓，A+D=2.2≥1✓，C+E=2.0≥1.5✓。\n\n最坏损失验证：A最坏损失1.2亿（全部归零）+B最坏损失0.8亿（政策冻结）+D最坏损失0.5亿（技术失败但可转售设备）=2.5亿<3亿✓。C和E为低风险基建和集成业务，即使在最坏情况（补贴取消+价格战严重）下仍保有资产价值，净损失有限。\n\n【敏感性分析·关键假设变化的影响】：\n\n假设1·固态电池成功概率变化：当前假设30%。如果实际成功概率仅10%→A预期回报1.2×0.1×5=0.6亿<投入1.2亿，负期望→调低A投入至0.3亿（仅维持基础研究跟踪），释放0.9亿到C/E。如果实际成功概率50%→A预期回报3亿，强烈推荐顶格投入2亿。\n\n假设2·B国政策走向：如果B国明确禁止外资控股矿业→B投资降为0，0.8亿转配到D（钠离子电池增加原材料保障）或C（充电桩扩容对冲B策略）。如果B国反而推出吸引外资矿业政策→B投资可增至1.5亿（中风险中回报，资源端的战略性布局）。\n\n假设3·充电桩补贴取消时间：如果补贴2025年确定取消→C投资减少至0.5亿（仅覆盖高利用率场景），剩余转配E（储能集成，补贴无影响且市场硬需求）。如果补贴延长至2028年→C可加大到1.8亿（抢补贴窗口期）。\n\n假设4·钠离子电池技术突破：如果D的技术成熟度被验证高于预期（已有接近量产的玩家）→D投资从1亿增加到1.5亿，加速中试和量产衔接。反之技术路线被证否→D降为0.3亿（仅保持文献跟踪），资金转配更确定的E。\n\n假设5·电化学储能市场需求增速：如果年增>50%→E可增至1.5亿（抢占窗口期市场份额）。如果年增<20%→E降为0.5亿（严重价格战压缩利润空间）。',
  },
];
