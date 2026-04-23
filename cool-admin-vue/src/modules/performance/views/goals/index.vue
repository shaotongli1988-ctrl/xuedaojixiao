<!-- 文件职责：承接“目标&计划总览”的目标运营台首页，统一编排今日运营、目标对比、目标配置和日报汇报四个工作区；不负责旧版目标地图 CRUD 页面、导航注册或外部群推送实现；依赖 goal ops API、基础用户/部门选项和前端权限判断；维护重点是员工/主管/HR 视角必须稳定裁剪，且公共目标贡献与个人补充目标贡献必须显式分栏。 -->
<template>
	<div v-if="canAccess" class="goal-ops-page">
		<el-card shadow="never" class="goal-ops-page__hero">
			<div class="goal-ops-page__hero-top">
				<div>
					<div class="goal-ops-page__eyebrow">目标&计划总览</div>
					<h1>目标运营台</h1>
					<p>
						围绕“上午下发、下午回填、自动统计、自动日报”运行，主管看团队闭环，员工看个人达成，
						HR 看规则底座。
					</p>
				</div>

				<div class="goal-ops-page__hero-tags">
					<el-tag effect="plain" type="info">{{ roleLabel }}</el-tag>
					<el-tag effect="plain"> 日期 {{ filters.planDate }} </el-tag>
					<el-tag effect="plain" type="success">
						{{ scopedDepartmentLabel }}
					</el-tag>
				</div>
			</div>

			<div class="goal-ops-page__toolbar">
				<div class="goal-ops-page__toolbar-left">
					<el-date-picker
						v-model="filters.planDate"
						type="date"
						value-format="YYYY-MM-DD"
						placeholder="运营日期"
						style="width: 180px"
					/>
					<el-select
						v-if="showDepartmentFilter"
						v-model="filters.departmentId"
						placeholder="部门"
						clearable
						filterable
						style="width: 190px"
					>
						<el-option
							v-for="item in manageableDepartmentOptions"
							:key="item.id"
							:label="item.label"
							:value="item.id"
						/>
					</el-select>
					<el-select
						v-if="showEmployeeFilter"
						v-model="filters.employeeId"
						placeholder="员工"
						clearable
						filterable
						style="width: 190px"
					>
						<el-option
							v-for="item in scopedUserOptions"
							:key="item.id"
							:label="item.name"
							:value="item.id"
						/>
					</el-select>
					<el-input
						v-model="filters.keyword"
						placeholder="按目标标题筛选"
						clearable
						style="width: 220px"
						@keyup.enter="refresh"
					/>
				</div>

				<div class="goal-ops-page__toolbar-right">
					<el-button @click="refresh">刷新</el-button>
					<el-button v-if="canCreatePersonalPlan" @click="openCreatePlan('personal')">
						新增个人补充目标
					</el-button>
					<el-button
						v-if="canManageDepartmentView"
						type="primary"
						@click="openCreatePlan('public')"
					>
						下发公共目标
					</el-button>
					<el-button
						v-if="canManageDepartmentView"
						type="warning"
						:loading="reportActionLoading === 'finalize'"
						@click="handleFinalizeDaily"
					>
						执行未填补零
					</el-button>
					<el-button
						v-if="canManageDepartmentView"
						type="success"
						:loading="reportActionLoading === 'generate'"
						@click="handleGenerateReport"
					>
						生成日报
					</el-button>
				</div>
			</div>
		</el-card>

		<el-row :gutter="16" class="goal-ops-page__summary">
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card
					shadow="never"
					class="goal-ops-page__metric goal-ops-page__metric--primary"
				>
					<div class="goal-ops-page__metric-label">团队完成率</div>
					<div class="goal-ops-page__metric-value">
						{{ formatPercent(overviewSummary.completionRate) }}
					</div>
					<div class="goal-ops-page__metric-meta">
						实际 {{ formatNumber(overviewSummary.totalActualValue) }} / 目标
						{{ formatNumber(overviewSummary.totalTargetValue) }}
					</div>
				</el-card>
			</el-col>
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never" class="goal-ops-page__metric">
					<div class="goal-ops-page__metric-label">公共目标贡献</div>
					<div class="goal-ops-page__metric-value">
						{{ formatNumber(overviewSummary.publicActualValue) }}
					</div>
					<div class="goal-ops-page__metric-meta">
						目标 {{ formatNumber(overviewSummary.publicTargetValue) }}
					</div>
				</el-card>
			</el-col>
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never" class="goal-ops-page__metric">
					<div class="goal-ops-page__metric-label">个人补充目标贡献</div>
					<div class="goal-ops-page__metric-value">
						{{ formatNumber(overviewSummary.personalActualValue) }}
					</div>
					<div class="goal-ops-page__metric-meta">
						目标 {{ formatNumber(overviewSummary.personalTargetValue) }}
					</div>
				</el-card>
			</el-col>
			<el-col :xs="24" :sm="12" :lg="6">
				<el-card shadow="never" class="goal-ops-page__metric">
					<div class="goal-ops-page__metric-label">今日填报状态</div>
					<div class="goal-ops-page__metric-value">
						{{ overviewSummary.submittedCount }}/{{ overviewSummary.assignedCount }}
					</div>
					<div class="goal-ops-page__metric-meta">
						自动补零 {{ overviewSummary.autoZeroCount }} 项
					</div>
				</el-card>
			</el-col>
		</el-row>

		<el-card shadow="never" class="goal-ops-page__section">
			<template #header>
				<div class="goal-ops-page__section-header">
					<div>
						<h2>今日运营区</h2>
						<p>上午目标下发与下午结果回填在同页闭环。</p>
					</div>
					<el-tag effect="plain" type="success">
						{{ departmentConfig.submitDeadline || '18:00' }} 截止
					</el-tag>
				</div>
			</template>

			<el-row :gutter="16">
				<el-col :xs="24" :xl="15">
					<el-card
						shadow="hover"
						class="goal-ops-page__panel"
						v-loading="todayPlansLoading"
					>
						<template #header>
							<div class="goal-ops-page__panel-header">
								<div>
									<h3>我的待回填目标</h3>
									<p>
										员工只维护自己的个人补充目标，但能同时看到公共目标分摊与实际完成值。
									</p>
								</div>
								<el-tag effect="plain"> {{ myTodayPlans.length }} 条 </el-tag>
							</div>
						</template>

						<el-empty
							v-if="!myTodayPlans.length"
							description="当前筛选下没有需要回填的个人目标"
						/>

						<template v-else>
							<el-table :data="myTodayPlans" border size="small">
								<el-table-column prop="title" label="目标项" min-width="180" />
								<el-table-column label="来源" width="120">
									<template #default="{ row }">
										<el-tag
											:type="
												row.sourceType === 'public' ? 'primary' : 'success'
											"
											effect="plain"
										>
											{{ sourceTypeLabel(row.sourceType) }}
										</el-tag>
									</template>
								</el-table-column>
								<el-table-column label="目标值" width="110">
									<template #default="{ row }">
										{{ formatNumber(row.targetValue) }}{{ row.unit || '' }}
									</template>
								</el-table-column>
								<el-table-column label="实际值" min-width="170">
									<template #default="{ row }">
										<el-input-number
											v-model="dailyDrafts[row.id || 0]"
											:min="0"
											:precision="2"
											:step="1"
											controls-position="right"
											style="width: 140px"
										/>
										<span class="goal-ops-page__inline-unit">{{
											row.unit || ''
										}}</span>
									</template>
								</el-table-column>
								<el-table-column label="状态" width="120">
									<template #default="{ row }">
										<el-tag
											:type="planStatusTagType(row.status)"
											effect="plain"
										>
											{{ planStatusLabel(row.status) }}
										</el-tag>
									</template>
								</el-table-column>
							</el-table>

							<div class="goal-ops-page__actions">
								<el-button
									type="primary"
									:loading="dailySubmitLoading"
									@click="handleSubmitMyDaily"
								>
									提交我的结果
								</el-button>
							</div>
						</template>
					</el-card>
				</el-col>

				<el-col :xs="24" :xl="9">
					<div class="goal-ops-page__stack">
						<el-card shadow="hover" class="goal-ops-page__panel">
							<template #header>
								<div class="goal-ops-page__panel-header">
									<div>
										<h3>团队完成概况</h3>
										<p>主管看部门，员工看自己的当日站位。</p>
									</div>
								</div>
							</template>

							<div class="goal-ops-page__mini-stats">
								<div class="goal-ops-page__mini-stat">
									<span>参与人数</span>
									<strong>{{ overviewSummary.employeeCount }}</strong>
								</div>
								<div class="goal-ops-page__mini-stat">
									<span>未填项</span>
									<strong>{{ pendingAssignedCount }}</strong>
								</div>
								<div class="goal-ops-page__mini-stat">
									<span>我的完成率</span>
									<strong>{{
										formatPercent(currentUserSummary?.completionRate || 0)
									}}</strong>
								</div>
							</div>

							<el-progress
								:percentage="Number(overviewSummary.completionRate || 0)"
								:stroke-width="12"
								:show-text="false"
							/>

							<div class="goal-ops-page__summary-grid">
								<div>
									<label>公共贡献</label>
									<strong>{{
										formatNumber(currentUserSummary?.publicActualValue || 0)
									}}</strong>
								</div>
								<div>
									<label>个人贡献</label>
									<strong>{{
										formatNumber(currentUserSummary?.personalActualValue || 0)
									}}</strong>
								</div>
							</div>
						</el-card>

						<el-card shadow="hover" class="goal-ops-page__panel">
							<template #header>
								<div class="goal-ops-page__panel-header">
									<div>
										<h3>日报状态</h3>
										<p>系统内留痕为主，发送状态按真实结果回写。</p>
									</div>
									<el-tag
										:type="reportStatusTagType(reportInfo?.status)"
										effect="plain"
									>
										{{ reportStatusLabel(reportInfo?.status) }}
									</el-tag>
								</div>
							</template>

							<div class="goal-ops-page__report-summary">
								<div>
									<span>生成时间</span>
									<strong>{{ reportInfo?.generatedAt || '未生成' }}</strong>
								</div>
								<div>
									<span>发送时间</span>
									<strong>{{ reportInfo?.sentAt || '未发送' }}</strong>
								</div>
								<div>
									<span>推送方式</span>
									<strong>{{
										reportInfo?.pushMode || departmentConfig.reportPushMode
									}}</strong>
								</div>
							</div>

							<div v-if="canManageDepartmentView" class="goal-ops-page__actions">
								<el-button
									:loading="reportActionLoading === 'sent'"
									@click="handleReportStatusUpdate('sent')"
								>
									标记已发送
								</el-button>
								<el-button
									type="warning"
									:loading="reportActionLoading === 'delayed'"
									@click="handleReportStatusUpdate('delayed')"
								>
									延期
								</el-button>
								<el-button
									type="danger"
									:loading="reportActionLoading === 'intercepted'"
									@click="handleReportStatusUpdate('intercepted')"
								>
									拦截
								</el-button>
							</div>
						</el-card>
					</div>
				</el-col>
			</el-row>
		</el-card>

		<el-card shadow="never" class="goal-ops-page__section">
			<template #header>
				<div class="goal-ops-page__section-header">
					<div>
						<h2>目标对比区</h2>
						<p>双榜并存，公共与个人贡献拆维度展示，同时保留近 7 天趋势。</p>
					</div>
				</div>
			</template>

			<el-row :gutter="16">
				<el-col :xs="24" :xl="12">
					<el-card shadow="hover" class="goal-ops-page__panel">
						<template #header>
							<div class="goal-ops-page__panel-header">
								<div>
									<h3>完成率榜</h3>
									<p>优先看目标完成率，次序再看绝对产出。</p>
								</div>
							</div>
						</template>

						<el-table :data="completionLeaderboard" border size="small">
							<el-table-column label="排名" width="70">
								<template #default="{ $index }">{{ $index + 1 }}</template>
							</el-table-column>
							<el-table-column prop="employeeName" label="员工" min-width="120" />
							<el-table-column label="完成率" min-width="140">
								<template #default="{ row }">
									<div class="goal-ops-page__progress-cell">
										<el-progress
											:percentage="Number(row.completionRate || 0)"
											:stroke-width="8"
											:show-text="false"
										/>
										<span>{{ formatPercent(row.completionRate) }}</span>
									</div>
								</template>
							</el-table-column>
							<el-table-column label="总产出" width="120">
								<template #default="{ row }">
									{{ formatNumber(row.totalActualValue) }}
								</template>
							</el-table-column>
						</el-table>
					</el-card>
				</el-col>

				<el-col :xs="24" :xl="12">
					<el-card shadow="hover" class="goal-ops-page__panel">
						<template #header>
							<div class="goal-ops-page__panel-header">
								<div>
									<h3>绝对产出榜</h3>
									<p>同部门实名对比，便于横向识别高产出与低完成率组合。</p>
								</div>
							</div>
						</template>

						<el-table :data="outputLeaderboard" border size="small">
							<el-table-column label="排名" width="70">
								<template #default="{ $index }">{{ $index + 1 }}</template>
							</el-table-column>
							<el-table-column prop="employeeName" label="员工" min-width="120" />
							<el-table-column label="总产出" width="120">
								<template #default="{ row }">
									{{ formatNumber(row.totalActualValue) }}
								</template>
							</el-table-column>
							<el-table-column label="公共/个人" min-width="170">
								<template #default="{ row }">
									{{ formatNumber(row.publicActualValue) }} /
									{{ formatNumber(row.personalActualValue) }}
								</template>
							</el-table-column>
						</el-table>
					</el-card>
				</el-col>
			</el-row>

			<el-row :gutter="16" class="goal-ops-page__split-row">
				<el-col :xs="24" :xl="12">
					<el-card shadow="hover" class="goal-ops-page__panel">
						<template #header>
							<div class="goal-ops-page__panel-header">
								<div>
									<h3>近 7 天纵向趋势</h3>
									<p>对比每日目标与实际完成，保留公共和个人贡献拆分。</p>
								</div>
							</div>
						</template>

						<el-table :data="trendRows" border size="small">
							<el-table-column prop="planDate" label="日期" min-width="110" />
							<el-table-column label="目标" width="110">
								<template #default="{ row }">
									{{ formatNumber(row.totalTargetValue) }}
								</template>
							</el-table-column>
							<el-table-column label="实际" width="110">
								<template #default="{ row }">
									{{ formatNumber(row.totalActualValue) }}
								</template>
							</el-table-column>
							<el-table-column label="公共/个人" min-width="150">
								<template #default="{ row }">
									{{ formatNumber(row.publicActualValue) }} /
									{{ formatNumber(row.personalActualValue) }}
								</template>
							</el-table-column>
							<el-table-column label="完成率" width="110">
								<template #default="{ row }">
									{{ formatPercent(row.completionRate) }}
								</template>
							</el-table-column>
						</el-table>
					</el-card>
				</el-col>

				<el-col :xs="24" :xl="12">
					<el-card shadow="hover" class="goal-ops-page__panel">
						<template #header>
							<div class="goal-ops-page__panel-header">
								<div>
									<h3>贡献拆维度明细</h3>
									<p>
										公共目标贡献与个人补充目标贡献永久拆栏展示，避免统计口径混淆。
									</p>
								</div>
							</div>
						</template>

						<el-table :data="contributionRows" border size="small">
							<el-table-column prop="employeeName" label="员工" min-width="120" />
							<el-table-column label="公共贡献" min-width="130">
								<template #default="{ row }">
									{{ formatNumber(row.publicActualValue) }} /
									{{ formatNumber(row.publicTargetValue) }}
								</template>
							</el-table-column>
							<el-table-column label="个人贡献" min-width="130">
								<template #default="{ row }">
									{{ formatNumber(row.personalActualValue) }} /
									{{ formatNumber(row.personalTargetValue) }}
								</template>
							</el-table-column>
							<el-table-column label="完成率" width="110">
								<template #default="{ row }">
									{{ formatPercent(row.completionRate) }}
								</template>
							</el-table-column>
							<el-table-column label="自动补零" width="100">
								<template #default="{ row }">
									{{ row.autoZeroCount }}
								</template>
							</el-table-column>
						</el-table>
					</el-card>
				</el-col>
			</el-row>
		</el-card>

		<el-card shadow="never" class="goal-ops-page__section">
			<template #header>
				<div class="goal-ops-page__section-header">
					<div>
						<h2>目标配置区</h2>
						<p>
							HR/管理员维护基础规则，主管维护本部门参数和计划池，员工只保留个人补充目标入口。
						</p>
					</div>
				</div>
			</template>

			<el-row :gutter="16">
				<el-col :xs="24" :xl="9">
					<el-card shadow="hover" class="goal-ops-page__panel">
						<template #header>
							<div class="goal-ops-page__panel-header">
								<div>
									<h3>部门运营参数</h3>
									<p>定义下发时间、截止时间和日报推送策略。</p>
								</div>
							</div>
						</template>

						<el-empty
							v-if="!canManageDepartmentView"
							description="员工不承担部门规则配置，仅保留查看与个人目标补充能力"
						/>

						<el-form
							v-else
							:model="departmentConfig"
							label-width="110px"
							class="goal-ops-page__config-form"
						>
							<el-form-item label="下发时间">
								<el-time-picker
									v-model="assignTimeModel"
									value-format="HH:mm"
									format="HH:mm"
									placeholder="09:00"
								/>
							</el-form-item>
							<el-form-item label="填报截止">
								<el-time-picker
									v-model="submitDeadlineModel"
									value-format="HH:mm"
									format="HH:mm"
									placeholder="18:00"
								/>
							</el-form-item>
							<el-form-item label="日报发送">
								<el-time-picker
									v-model="reportSendTimeModel"
									value-format="HH:mm"
									format="HH:mm"
									placeholder="18:30"
								/>
							</el-form-item>
							<el-form-item label="推送方式">
								<el-select
									v-model="departmentConfig.reportPushMode"
									style="width: 100%"
								>
									<el-option label="系统内+群推送" value="system_and_group" />
									<el-option label="仅系统内" value="system_only" />
									<el-option label="仅群推送" value="group_only" />
								</el-select>
							</el-form-item>
							<el-form-item label="推送目标">
								<el-input
									v-model="reportPushTargetModel"
									placeholder="部门群 / Webhook / 讨论组"
								/>
							</el-form-item>
							<el-form-item>
								<el-button
									type="primary"
									:loading="configSaving"
									@click="handleSaveDepartmentConfig"
								>
									保存部门配置
								</el-button>
							</el-form-item>
						</el-form>
					</el-card>
				</el-col>

				<el-col v-if="canManageDepartmentView" :xs="24" :xl="15">
					<el-card
						shadow="hover"
						class="goal-ops-page__panel"
						v-loading="planPageLoading"
					>
						<template #header>
							<div class="goal-ops-page__panel-header">
								<div>
									<h3>计划池</h3>
									<p>主管管理公共目标，员工只可维护自己的个人补充目标。</p>
								</div>
								<el-tag effect="plain"> {{ planPagination.total }} 条 </el-tag>
							</div>
						</template>

						<div class="goal-ops-page__sub-toolbar">
							<el-select
								v-model="planFilters.periodType"
								style="width: 130px"
								@change="handlePlanFilterChange"
							>
								<el-option
									v-for="item in periodTypeOptions"
									:key="item.value"
									:label="item.label"
									:value="item.value"
								/>
							</el-select>
							<el-select
								v-model="planFilters.sourceType"
								clearable
								placeholder="来源"
								style="width: 150px"
								@change="handlePlanFilterChange"
							>
								<el-option
									v-for="item in sourceTypeOptions"
									:key="item.value"
									:label="item.label"
									:value="item.value"
								/>
							</el-select>
							<el-input
								v-model="planFilters.keyword"
								placeholder="目标项关键词"
								clearable
								style="width: 220px"
								@keyup.enter="handlePlanFilterChange"
							/>
							<el-button @click="handlePlanFilterChange">查询</el-button>
						</div>

						<el-table :data="planRows" border size="small">
							<el-table-column prop="title" label="目标项" min-width="180" />
							<el-table-column prop="employeeName" label="员工" min-width="110" />
							<el-table-column label="周期" width="100">
								<template #default="{ row }">
									{{ periodTypeLabel(row.periodType) }}
								</template>
							</el-table-column>
							<el-table-column label="来源" width="110">
								<template #default="{ row }">
									<el-tag
										:type="row.sourceType === 'public' ? 'primary' : 'success'"
										effect="plain"
									>
										{{ sourceTypeLabel(row.sourceType) }}
									</el-tag>
								</template>
							</el-table-column>
							<el-table-column label="目标 / 实际" min-width="140">
								<template #default="{ row }">
									{{ formatNumber(row.targetValue) }} /
									{{ formatNumber(row.actualValue) }}
								</template>
							</el-table-column>
							<el-table-column label="周期范围" min-width="180">
								<template #default="{ row }">
									{{ row.periodStartDate }} ~ {{ row.periodEndDate }}
								</template>
							</el-table-column>
							<el-table-column label="状态" width="110">
								<template #default="{ row }">
									<el-tag :type="planStatusTagType(row.status)" effect="plain">
										{{ planStatusLabel(row.status) }}
									</el-tag>
								</template>
							</el-table-column>
							<el-table-column label="操作" min-width="180" fixed="right">
								<template #default="{ row }">
									<el-button
										v-if="canEditPlan(row)"
										text
										type="primary"
										@click="openEditPlan(row)"
									>
										编辑
									</el-button>
									<el-button
										v-if="canDeletePlan(row)"
										text
										type="danger"
										@click="handleDeletePlan(row)"
									>
										删除
									</el-button>
								</template>
							</el-table-column>
						</el-table>

						<div class="goal-ops-page__pagination">
							<el-pagination
								background
								layout="total, prev, pager, next"
								:current-page="planPagination.page"
								:page-size="planPagination.size"
								:total="planPagination.total"
								@current-change="handlePlanPageChange"
							/>
						</div>
					</el-card>
				</el-col>

				<el-col v-else :xs="24" :xl="15">
					<el-card shadow="hover" class="goal-ops-page__panel">
						<template #header>
							<div class="goal-ops-page__panel-header">
								<div>
									<h3>个人补充目标说明</h3>
									<p>
										员工侧只保留个人补充目标入口，不展示部门计划池与部门规则编辑能力。
									</p>
								</div>
							</div>
						</template>

						<div class="goal-ops-page__report-summary">
							<div>
								<span>当前日期</span>
								<strong>{{ filters.planDate }}</strong>
							</div>
							<div>
								<span>我的目标数</span>
								<strong>{{ myTodayPlans.length }}</strong>
							</div>
							<div>
								<span>操作入口</span>
								<strong>新增个人补充目标</strong>
							</div>
						</div>

						<el-alert
							title="主管下发的公共目标会出现在“我的待回填目标”中；个人补充目标无需主管确认，保存后直接进入统计。"
							type="info"
							:closable="false"
							show-icon
						/>
					</el-card>
				</el-col>
			</el-row>
		</el-card>

		<el-card shadow="never" class="goal-ops-page__section">
			<template #header>
				<div class="goal-ops-page__section-header">
					<div>
						<h2>日报汇报区</h2>
						<p>下午对全部门数据自动汇总，保留异常人员与记 0 人员清单。</p>
					</div>
				</div>
			</template>

			<el-row :gutter="16">
				<el-col :xs="24" :xl="14">
					<el-card shadow="hover" class="goal-ops-page__panel">
						<template #header>
							<div class="goal-ops-page__panel-header">
								<div>
									<h3>日报摘要</h3>
									<p>只按真实生成结果展示，未生成则明确为空。</p>
								</div>
							</div>
						</template>

						<el-empty v-if="!reportInfo?.summary" description="当前日期尚未生成日报" />

						<template v-else>
							<div class="goal-ops-page__report-kpis">
								<div>
									<label>部门完成率</label>
									<strong>{{
										formatPercent(
											reportInfo.summary.departmentSummary.completionRate
										)
									}}</strong>
								</div>
								<div>
									<label>实际/目标</label>
									<strong>
										{{
											formatNumber(
												reportInfo.summary.departmentSummary
													.totalActualValue
											)
										}}
										/
										{{
											formatNumber(
												reportInfo.summary.departmentSummary
													.totalTargetValue
											)
										}}
									</strong>
								</div>
								<div>
									<label>自动补零</label>
									<strong>{{
										reportInfo.summary.departmentSummary.autoZeroCount
									}}</strong>
								</div>
							</div>

							<el-row :gutter="16">
								<el-col :xs="24" :md="12">
									<h4 class="goal-ops-page__subheading">完成率榜 Top5</h4>
									<ol class="goal-ops-page__rank-list">
										<li
											v-for="item in reportInfo.summary
												.topCompletionEmployees"
											:key="`completion-${item.employeeId}`"
										>
											<span>{{ item.employeeName }}</span>
											<strong>{{
												formatPercent(item.completionRate)
											}}</strong>
										</li>
									</ol>
								</el-col>
								<el-col :xs="24" :md="12">
									<h4 class="goal-ops-page__subheading">绝对产出榜 Top5</h4>
									<ol class="goal-ops-page__rank-list">
										<li
											v-for="item in reportInfo.summary.topOutputEmployees"
											:key="`output-${item.employeeId}`"
										>
											<span>{{ item.employeeName }}</span>
											<strong>{{
												formatNumber(item.totalActualValue)
											}}</strong>
										</li>
									</ol>
								</el-col>
							</el-row>
						</template>
					</el-card>
				</el-col>

				<el-col :xs="24" :xl="10">
					<el-card shadow="hover" class="goal-ops-page__panel">
						<template #header>
							<div class="goal-ops-page__panel-header">
								<div>
									<h3>异常与补零人员</h3>
									<p>未填项按 0 入账后，在日报中显式列出，避免隐形吞掉。</p>
								</div>
							</div>
						</template>

						<el-empty
							v-if="!reportInfo?.summary?.autoZeroEmployees?.length"
							description="当前日报没有自动补零人员"
						/>

						<ul v-else class="goal-ops-page__zero-list">
							<li
								v-for="item in reportInfo.summary.autoZeroEmployees"
								:key="item.employeeId"
							>
								<span>{{ item.employeeName }}</span>
								<strong>{{ item.autoZeroCount }} 项</strong>
							</li>
						</ul>

						<div v-if="reportInfo?.operationRemark" class="goal-ops-page__remark">
							最近备注：{{ reportInfo.operationRemark }}
						</div>
					</el-card>
				</el-col>
			</el-row>
		</el-card>

		<el-dialog
			v-model="planDialogVisible"
			:title="editingPlanId ? '编辑目标计划' : '新增目标计划'"
			width="720px"
			destroy-on-close
		>
			<el-form ref="planFormRef" :model="planForm" :rules="planRules" label-width="110px">
				<el-row :gutter="16">
					<el-col :span="12">
						<el-form-item label="目标来源" prop="sourceType">
							<el-radio-group
								v-model="planForm.sourceType"
								:disabled="Boolean(editingPlanId)"
							>
								<el-radio
									v-for="item in sourceTypeOptions"
									:key="item.value"
									:label="item.value"
								>
									{{ item.label }}
								</el-radio>
							</el-radio-group>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="周期类型" prop="periodType">
							<el-select v-model="planForm.periodType" @change="handlePlanTypeChange">
								<el-option
									v-for="item in periodTypeOptions"
									:key="item.value"
									:label="item.label"
									:value="item.value"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="所属员工" prop="employeeId">
							<el-select
								v-model="planForm.employeeId"
								filterable
								:disabled="
									planForm.sourceType === 'personal' && !hasCompanyGoalScope
								"
							>
								<el-option
									v-for="item in scopedUserOptions"
									:key="item.id"
									:label="item.name"
									:value="item.id"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="目标日期" prop="planDate">
							<el-date-picker
								v-model="planDateModel"
								type="date"
								value-format="YYYY-MM-DD"
								placeholder="仅日目标必填"
								:disabled="planForm.periodType !== 'day'"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="开始日期" prop="periodStartDate">
							<el-date-picker
								v-model="planForm.periodStartDate"
								type="date"
								value-format="YYYY-MM-DD"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="结束日期" prop="periodEndDate">
							<el-date-picker
								v-model="planForm.periodEndDate"
								type="date"
								value-format="YYYY-MM-DD"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="24">
						<el-form-item label="目标标题" prop="title">
							<el-input
								v-model="planForm.title"
								placeholder="例如：电话量 / 课程回访 / 自拓客户"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="目标值" prop="targetValue">
							<el-input-number
								v-model="planTargetValueModel"
								:min="0.01"
								:precision="2"
								:step="1"
								controls-position="right"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="单位">
							<el-input v-model="unitModel" placeholder="个 / 次 / 单 / %" />
						</el-form-item>
					</el-col>
					<el-col :span="24">
						<el-form-item label="说明">
							<el-input
								v-model="descriptionModel"
								type="textarea"
								:rows="3"
								placeholder="补充说明目标来源、拆分口径或计划背景"
							/>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>

			<template #footer>
				<el-button @click="planDialogVisible = false">取消</el-button>
				<el-button type="primary" :loading="planSubmitLoading" @click="handleSavePlan">
					保存
				</el-button>
			</template>
		</el-dialog>
	</div>

	<el-card v-else shadow="never">
		<el-empty description="当前账号没有目标&计划总览访问权限" />
	</el-card>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-goal-ops-overview'
});

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { useUserStore } from '/$/base/store/user';
import { useDict } from '/$/dict';
import { service } from '/@/cool';
import { useListPage } from '../../composables/use-list-page.js';
import { performanceGoalService } from '../../service/goal';
import { resolvePerformanceRoleFact } from '../../service/role-fact';
import {
	confirmElementAction,
	promptElementAction,
	runTrackedElementAction
} from '../shared/action-feedback';
import {
	createElementWarningFromErrorHandler,
	resolveErrorMessage,
	showElementErrorFromError,
	showElementWarningFromError
} from '../shared/error-message';
import { loadDepartmentOptions, loadUserOptions } from '../../utils/lookup-options.js';
import type {
	DepartmentOption,
	GoalOpsAccessProfile,
	GoalOpsDepartmentConfig,
	GoalOpsOverview,
	GoalOpsOverviewQuery,
	GoalOpsOverviewRow,
	GoalOpsPlanPageResult,
	GoalOpsPlanRecord,
	GoalOpsPlanStatus,
	GoalOpsPeriodType,
	GoalOpsReportInfo,
	GoalOpsReportStatus,
	GoalOpsSourceType,
	GoalOpsTrendRow,
	UserOption
} from '../../types';
import {
	createEmptyGoalOpsAccessProfile,
	createEmptyGoalOpsDepartmentConfig,
	createEmptyGoalOpsPlan
} from '../../types';

const GOAL_SOURCE_TYPE_DICT_KEY = 'performance.goal.sourceType';
const GOAL_PERIOD_TYPE_DICT_KEY = 'performance.goal.periodType';
const GOAL_PLAN_STATUS_DICT_KEY = 'performance.goal.planStatus';
const GOAL_REPORT_STATUS_DICT_KEY = 'performance.goal.reportStatus';

const user = useUserStore();
const { dict } = useDict();
const canAccess = computed(() => checkPerm(performanceGoalService.permission.page));
const accessProfile = reactive<GoalOpsAccessProfile>(createEmptyGoalOpsAccessProfile());
const hasCompanyGoalScope = computed(() => accessProfile.scopeKey === 'company');
const canManageDepartmentView = computed(() => accessProfile.canManageDepartment);
const canCreatePersonalPlan = computed(() => accessProfile.canMaintainPersonalPlan);
const roleFact = computed(() =>
	resolvePerformanceRoleFact({
		personaKey: accessProfile.activePersonaKey || null,
		roleKind: accessProfile.roleKind || null
	})
);
const manageableDepartmentOptions = computed(() => {
	if (accessProfile.manageableDepartmentIds.length === 0) {
		if (hasCompanyGoalScope.value) {
			return departmentOptions.value;
		}
		return departmentOptions.value.filter(item => item.id === currentDepartmentId.value);
	}

	return departmentOptions.value.filter(item =>
		accessProfile.manageableDepartmentIds.includes(Number(item.id))
	);
});
const showDepartmentFilter = computed(() => manageableDepartmentOptions.value.length > 1);
const showEmployeeFilter = computed(
	() => hasCompanyGoalScope.value || canManageDepartmentView.value
);

const filters = reactive({
	planDate: formatDate(new Date()),
	departmentId: undefined as number | undefined,
	employeeId: undefined as number | undefined,
	keyword: ''
});

const planFilters = reactive({
	periodType: 'day' as GoalOpsPeriodType,
	sourceType: '' as GoalOpsSourceType | '',
	keyword: ''
});

const sourceTypeOptions = computed<Array<{ label: string; value: GoalOpsSourceType }>>(() =>
	dict.get(GOAL_SOURCE_TYPE_DICT_KEY).value.map(item => ({
		label: item.label,
		value: item.value as GoalOpsSourceType
	}))
);

const periodTypeOptions = computed<Array<{ label: string; value: GoalOpsPeriodType }>>(() =>
	dict.get(GOAL_PERIOD_TYPE_DICT_KEY).value.map(item => ({
		label: item.label,
		value: item.value as GoalOpsPeriodType
	}))
);

const userOptions = ref<UserOption[]>([]);
const departmentOptions = ref<DepartmentOption[]>([]);
const overview = ref<GoalOpsOverview | null>(null);
const todayPlans = ref<GoalOpsPlanRecord[]>([]);
const trendPlans = ref<GoalOpsPlanRecord[]>([]);
const reportInfo = ref<GoalOpsReportInfo | null>(null);

const overviewLoading = ref(false);
const todayPlansLoading = ref(false);
const dailySubmitLoading = ref(false);
const configSaving = ref(false);
const reportActionLoading = ref('');

const departmentConfig = reactive<GoalOpsDepartmentConfig>(createEmptyGoalOpsDepartmentConfig());
const dailyDrafts = reactive<Record<number, number>>({});

const planDialogVisible = ref(false);
const planSubmitLoading = ref(false);
const planFormRef = ref<FormInstance>();
const editingPlanId = ref<number | null>(null);
const planForm = reactive<GoalOpsPlanRecord>(createEmptyGoalOpsPlan());

const planRules: FormRules = {
	employeeId: [{ required: true, message: '请选择所属员工', trigger: 'change' }],
	sourceType: [{ required: true, message: '请选择目标来源', trigger: 'change' }],
	periodType: [{ required: true, message: '请选择周期类型', trigger: 'change' }],
	title: [{ required: true, message: '请输入目标标题', trigger: 'blur' }],
	periodStartDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
	periodEndDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
	planDate: [
		{
			validator: (_rule, value, callback) => {
				if (planForm.periodType === 'day' && !value) {
					callback(new Error('日目标必须指定目标日期'));
					return;
				}
				callback();
			},
			trigger: 'change'
		}
	],
	targetValue: [
		{
			validator: (_rule, value, callback) => {
				if (Number(value || 0) <= 0) {
					callback(new Error('目标值必须大于 0'));
					return;
				}
				callback();
			},
			trigger: 'change'
		}
	]
};

const currentUserId = computed(() => normalizeNumber(user.info?.id));
const currentDepartmentId = computed(() => normalizeNumber(user.info?.departmentId));
const scopedDepartmentId = computed(() => filters.departmentId || currentDepartmentId.value);
const planScopedEmployeeId = computed(() => {
	return showEmployeeFilter.value ? filters.employeeId : currentUserId.value;
});
const scopedDepartmentLabel = computed(() => {
	const department =
		manageableDepartmentOptions.value.find(item => item.id === scopedDepartmentId.value) ||
		departmentOptions.value.find(item => item.id === scopedDepartmentId.value);
	return department?.label || user.info?.departmentName || '当前部门';
});
const scopedUserOptions = computed(() => {
	if (!scopedDepartmentId.value) {
		return userOptions.value;
	}

	return userOptions.value.filter(item => {
		return !item.departmentId || Number(item.departmentId) === Number(scopedDepartmentId.value);
	});
});
const roleLabel = computed(() => {
	if (hasCompanyGoalScope.value) {
		return `${roleFact.value.roleLabel} / 全局范围`;
	}
	if (canManageDepartmentView.value) {
		return `${roleFact.value.roleLabel} / 部门范围`;
	}
	return `${roleFact.value.roleLabel} / 个人范围`;
});
const overviewSummary = computed(() => {
	return (
		overview.value?.departmentSummary || {
			planDate: filters.planDate,
			departmentId: scopedDepartmentId.value || 0,
			employeeCount: 0,
			publicTargetValue: 0,
			publicActualValue: 0,
			personalTargetValue: 0,
			personalActualValue: 0,
			totalTargetValue: 0,
			totalActualValue: 0,
			completionRate: 0,
			assignedCount: 0,
			submittedCount: 0,
			autoZeroCount: 0
		}
	);
});
const pendingAssignedCount = computed(() => {
	return Math.max(overviewSummary.value.assignedCount - overviewSummary.value.submittedCount, 0);
});
const currentUserSummary = computed(() => {
	return overview.value?.rows.find(
		item => Number(item.employeeId) === Number(currentUserId.value || 0)
	);
});
const myTodayPlans = computed(() => {
	return todayPlans.value.filter(
		item => Number(item.employeeId) === Number(currentUserId.value || 0)
	);
});
const completionLeaderboard = computed(() => overview.value?.leaderboard?.completionRate || []);
const outputLeaderboard = computed(() => overview.value?.leaderboard?.output || []);
const contributionRows = computed(() => {
	if (!overview.value?.rows?.length) {
		return [];
	}

	if (!canManageDepartmentView.value && !hasCompanyGoalScope.value && currentUserSummary.value) {
		return [currentUserSummary.value];
	}

	return overview.value.rows;
});
const trendRows = computed<GoalOpsTrendRow[]>(() => buildTrendRows(trendPlans.value));

const assignTimeModel = computed({
	get: () => departmentConfig.assignTime || '09:00',
	set: value => {
		departmentConfig.assignTime = String(value || '').trim();
	}
});
const submitDeadlineModel = computed({
	get: () => departmentConfig.submitDeadline || '18:00',
	set: value => {
		departmentConfig.submitDeadline = String(value || '').trim();
	}
});
const reportSendTimeModel = computed({
	get: () => departmentConfig.reportSendTime || '18:30',
	set: value => {
		departmentConfig.reportSendTime = String(value || '').trim();
	}
});
const reportPushTargetModel = computed({
	get: () => departmentConfig.reportPushTarget || '',
	set: value => {
		departmentConfig.reportPushTarget = String(value || '').trim();
	}
});
const planDateModel = computed({
	get: () => planForm.planDate || '',
	set: value => {
		planForm.planDate = value || '';
	}
});
const planTargetValueModel = computed({
	get: () => Number(planForm.targetValue || 0),
	set: value => {
		planForm.targetValue = Number(value || 0);
	}
});
const unitModel = computed({
	get: () => planForm.unit || '',
	set: value => {
		planForm.unit = String(value || '').trim();
	}
});
const descriptionModel = computed({
	get: () => planForm.description || '',
	set: value => {
		planForm.description = String(value || '').trim();
	}
});
const goalPlanList = useListPage({
	createFilters: () => ({
		periodType: 'day' as GoalOpsPeriodType,
		sourceType: '' as GoalOpsSourceType | '',
		keyword: ''
	}),
	canLoad: () => canAccess.value,
	fetchPage: async params => {
		const result = await performanceGoalService.fetchOpsPlanPage({
			page: params.page,
			size: params.size,
			periodType: params.periodType,
			planDate: params.periodType === 'day' ? filters.planDate : undefined,
			departmentId: scopedDepartmentId.value,
			employeeId: planScopedEmployeeId.value,
			sourceType: params.sourceType || undefined,
			keyword: params.keyword || undefined
		});

		return {
			...result,
			list: normalizePlanList(result)
		};
	},
	onError: (error: unknown) => {
		showElementErrorFromError(error, '计划池加载失败');
	}
});
const planRows = goalPlanList.rows;
const planPageLoading = goalPlanList.loading;
const planPagination = goalPlanList.pager;

watch(
	() => [filters.departmentId, filters.employeeId, filters.planDate],
	() => {
		planPagination.page = 1;
	}
);

onMounted(async () => {
	await dict.refresh([
		GOAL_SOURCE_TYPE_DICT_KEY,
		GOAL_PERIOD_TYPE_DICT_KEY,
		GOAL_PLAN_STATUS_DICT_KEY,
		GOAL_REPORT_STATUS_DICT_KEY
	]);
	await ensureUserLoaded();
	await Promise.all([loadUsers(), loadDepartments()]);
	initializeDefaultFilters();
	await refresh();
});

async function ensureUserLoaded() {
	if (!user.info) {
		await user.get();
	}
}

function initializeDefaultFilters() {
	if (!filters.departmentId && currentDepartmentId.value) {
		filters.departmentId = currentDepartmentId.value;
	}
}

async function loadUsers() {
	userOptions.value = await loadUserOptions(
		() =>
			service.base.sys.user.page({
				page: 1,
				size: 500
			}),
		createElementWarningFromErrorHandler('员工选项加载失败')
	);
}

async function loadDepartments() {
	departmentOptions.value = await loadDepartmentOptions(
		() => service.base.sys.department.list(),
		createElementWarningFromErrorHandler('部门选项加载失败')
	);
}

async function refresh() {
	if (!canAccess.value) {
		return;
	}

	if (!filters.planDate) {
		ElMessage.warning('请选择运营日期');
		return;
	}

	await loadAccessProfile();
	await Promise.all([
		loadOverview(),
		loadTodayPlans(),
		loadTrendPlans(),
		loadPlanPage(),
		loadDepartmentConfig(),
		loadReportInfo()
	]);
}

async function loadAccessProfile() {
	const requestedDepartmentId = filters.departmentId || currentDepartmentId.value;

	try {
		const result = await performanceGoalService.fetchOpsAccessProfile({
			departmentId: requestedDepartmentId
		});
		Object.assign(accessProfile, createEmptyGoalOpsAccessProfile(), result);

		if (
			result.scopeKey !== 'company' &&
			Array.isArray(result.manageableDepartmentIds) &&
			result.manageableDepartmentIds.length
		) {
			if (
				!filters.departmentId ||
				!result.manageableDepartmentIds.includes(Number(filters.departmentId))
			) {
				filters.departmentId = Number(result.manageableDepartmentIds[0]);
			}
			return;
		}

		if (!filters.departmentId && result.departmentId) {
			filters.departmentId = Number(result.departmentId);
		}
	} catch (error: unknown) {
		Object.assign(accessProfile, createEmptyGoalOpsAccessProfile(), {
			departmentId: requestedDepartmentId || null
		});
		showElementErrorFromError(error, '目标运营台权限加载失败');
	}
}

async function loadOverview() {
	overviewLoading.value = true;

	try {
		const request: GoalOpsOverviewQuery = {
			planDate: filters.planDate,
			departmentId: scopedDepartmentId.value,
			employeeId: showEmployeeFilter.value ? filters.employeeId : undefined
		};
		overview.value = await performanceGoalService.fetchOpsOverview(request);
	} catch (error: unknown) {
		overview.value = null;
		showElementErrorFromError(error, '目标运营台总览加载失败');
	} finally {
		overviewLoading.value = false;
	}
}

async function loadTodayPlans() {
	todayPlansLoading.value = true;

	try {
		const result = await performanceGoalService.fetchOpsPlanPage({
			page: 1,
			size: 200,
			periodType: 'day',
			planDate: filters.planDate,
			departmentId: scopedDepartmentId.value,
			employeeId: planScopedEmployeeId.value,
			keyword: filters.keyword || undefined
		});
		todayPlans.value = normalizePlanList(result);
		syncDailyDrafts();
	} catch (error: unknown) {
		todayPlans.value = [];
		showElementErrorFromError(error, '今日目标加载失败');
	} finally {
		todayPlansLoading.value = false;
	}
}

async function loadTrendPlans() {
	try {
		const result = await performanceGoalService.fetchOpsPlanPage({
			page: 1,
			size: 400,
			periodType: 'day',
			departmentId: scopedDepartmentId.value,
			employeeId: planScopedEmployeeId.value,
			periodStartDate: offsetDate(filters.planDate, -6),
			periodEndDate: filters.planDate
		});
		trendPlans.value = normalizePlanList(result);
	} catch (error: unknown) {
		trendPlans.value = [];
		showElementWarningFromError(error, '趋势数据加载失败');
	}
}

async function loadPlanPage() {
	Object.assign(goalPlanList.filters, planFilters);
	await goalPlanList.reload();
}

async function loadDepartmentConfig() {
	if (!scopedDepartmentId.value) {
		return;
	}

	if (!canManageDepartmentView.value && !hasCompanyGoalScope.value) {
		Object.assign(departmentConfig, createEmptyGoalOpsDepartmentConfig(), {
			departmentId: scopedDepartmentId.value,
			departmentName: scopedDepartmentLabel.value
		});
		return;
	}

	try {
		const result = await performanceGoalService.fetchOpsDepartmentConfig({
			departmentId: scopedDepartmentId.value
		});
		Object.assign(departmentConfig, createEmptyGoalOpsDepartmentConfig(), result);
	} catch (error: unknown) {
		if (canManageDepartmentView.value || hasCompanyGoalScope.value) {
			showElementWarningFromError(error, '部门配置加载失败');
		}
	}
}

async function loadReportInfo() {
	if (!canManageDepartmentView.value && !hasCompanyGoalScope.value) {
		reportInfo.value = null;
		return;
	}

	if (!scopedDepartmentId.value) {
		reportInfo.value = null;
		return;
	}

	try {
		reportInfo.value = await performanceGoalService.fetchOpsReportInfo({
			departmentId: scopedDepartmentId.value,
			reportDate: filters.planDate
		});
	} catch (error: unknown) {
		if (isMissingDailyReportError(error)) {
			reportInfo.value = null;
			return;
		}
		reportInfo.value = null;
		showElementWarningFromError(error, '日报信息加载失败');
	}
}

function syncDailyDrafts() {
	for (const item of myTodayPlans.value) {
		if (!item.id) {
			continue;
		}
		dailyDrafts[item.id] = Number(item.actualValue || 0);
	}
}

async function handleSubmitMyDaily() {
	const items = myTodayPlans.value
		.filter(item => item.id)
		.map(item => ({
			planId: Number(item.id),
			actualValue: Number(dailyDrafts[item.id || 0] || 0)
		}));

	if (!items.length) {
		ElMessage.warning('当前没有可提交的目标项');
		return;
	}

	dailySubmitLoading.value = true;

	try {
		overview.value = await performanceGoalService.submitOpsDailyResults({
			planDate: filters.planDate,
			departmentId: scopedDepartmentId.value,
			items
		});
		ElMessage.success('当日结果提交成功');
		await Promise.all([loadTodayPlans(), loadTrendPlans(), loadReportInfo()]);
	} catch (error: unknown) {
		showElementErrorFromError(error, '当日结果提交失败');
	} finally {
		dailySubmitLoading.value = false;
	}
}

async function handleSaveDepartmentConfig() {
	if (!scopedDepartmentId.value) {
		ElMessage.warning('当前部门不存在');
		return;
	}

	configSaving.value = true;

	try {
		const result = await performanceGoalService.saveOpsDepartmentConfig({
			...departmentConfig,
			departmentId: scopedDepartmentId.value
		});
		Object.assign(departmentConfig, createEmptyGoalOpsDepartmentConfig(), result);
		ElMessage.success('部门配置已保存');
	} catch (error: unknown) {
		showElementErrorFromError(error, '部门配置保存失败');
	} finally {
		configSaving.value = false;
	}
}

async function handleFinalizeDaily() {
	if (!scopedDepartmentId.value) {
		ElMessage.warning('当前部门不存在');
		return;
	}

	const confirmed = await confirmElementAction(
		`将对 ${filters.planDate} 未填报项执行自动补零，该操作会按真实状态写入日报留痕。`,
		'执行未填补零'
	);

	if (!confirmed) {
		return;
	}

	await runTrackedElementAction({
		rowId: scopedDepartmentId.value,
		actionType: 'finalize',
		request: async () => {
			const result = await performanceGoalService.finalizeOpsDailyResults({
				departmentId: scopedDepartmentId.value!,
				planDate: filters.planDate
			});
			ElMessage.success(`已完成补零，共处理 ${result.autoZeroCount} 项`);
		},
		errorMessage: '自动补零失败',
		setLoading: rowId => {
			reportActionLoading.value = rowId ? 'finalize' : '';
		},
		refresh: async () => {
			await Promise.all([
				loadOverview(),
				loadTodayPlans(),
				loadTrendPlans(),
				loadReportInfo()
			]);
		}
	});
}

async function handleGenerateReport() {
	if (!scopedDepartmentId.value) {
		ElMessage.warning('当前部门不存在');
		return;
	}

	reportActionLoading.value = 'generate';

	try {
		reportInfo.value = await performanceGoalService.generateOpsReport({
			departmentId: scopedDepartmentId.value,
			planDate: filters.planDate
		});
		ElMessage.success('日报已生成');
		await loadOverview();
	} catch (error: unknown) {
		showElementErrorFromError(error, '日报生成失败');
	} finally {
		reportActionLoading.value = '';
	}
}

async function handleReportStatusUpdate(status: GoalOpsReportStatus) {
	if (!scopedDepartmentId.value) {
		ElMessage.warning('当前部门不存在');
		return;
	}

	if (!reportInfo.value) {
		ElMessage.warning('请先生成日报');
		return;
	}

	let remark = '';
	if (status === 'intercepted' || status === 'delayed') {
		const result = await promptElementAction('请输入本次操作备注', reportStatusLabel(status), {
			inputPlaceholder: '例如：主管暂缓发送，待补充异常说明'
		});
		if (!result) {
			return;
		}
		remark = result.value;
	}

	await runTrackedElementAction({
		rowId: scopedDepartmentId.value,
		actionType: status,
		request: async () => {
			reportInfo.value = await performanceGoalService.updateOpsReportStatus({
				departmentId: scopedDepartmentId.value!,
				reportDate: filters.planDate,
				status,
				remark
			});
		},
		successMessage: `日报状态已更新为${reportStatusLabel(status)}`,
		errorMessage: '日报状态更新失败',
		setLoading: rowId => {
			reportActionLoading.value = rowId ? status : '';
		}
	});
}

function openCreatePlan(sourceType: GoalOpsSourceType) {
	if (sourceType === 'public' && !canManageDepartmentView.value) {
		ElMessage.warning('仅主管或 HR 可下发公共目标');
		return;
	}

	if (sourceType === 'personal' && !canCreatePersonalPlan.value) {
		ElMessage.warning('当前账号无权维护个人补充目标');
		return;
	}

	editingPlanId.value = null;
	Object.assign(planForm, createEmptyGoalOpsPlan(currentUserId.value), {
		departmentId: scopedDepartmentId.value,
		employeeId:
			sourceType === 'personal' ? currentUserId.value : filters.employeeId || undefined,
		sourceType,
		periodType: 'day',
		planDate: filters.planDate,
		periodStartDate: filters.planDate,
		periodEndDate: filters.planDate
	});
	planDialogVisible.value = true;
}

async function openEditPlan(row: GoalOpsPlanRecord) {
	if (!row.id) {
		return;
	}

	try {
		const detail = await performanceGoalService.fetchOpsPlanInfo({ id: row.id });
		editingPlanId.value = Number(detail.id || 0);
		Object.assign(planForm, createEmptyGoalOpsPlan(currentUserId.value), detail);
		planDialogVisible.value = true;
	} catch (error: unknown) {
		showElementErrorFromError(error, '目标计划详情加载失败');
	}
}

async function handleSavePlan() {
	await planFormRef.value?.validate();

	if (!planForm.periodStartDate || !planForm.periodEndDate) {
		ElMessage.warning('请填写完整周期范围');
		return;
	}

	if (planForm.periodStartDate > planForm.periodEndDate) {
		ElMessage.warning('开始日期不能晚于结束日期');
		return;
	}

	if (planForm.periodType === 'day' && !planForm.planDate) {
		planForm.planDate = planForm.periodStartDate;
	}

	if (planForm.sourceType === 'personal' && !hasCompanyGoalScope.value && currentUserId.value) {
		planForm.employeeId = currentUserId.value;
	}

	planSubmitLoading.value = true;

	try {
		await performanceGoalService.saveOpsPlan({
			...planForm,
			id: editingPlanId.value || undefined,
			departmentId: scopedDepartmentId.value || planForm.departmentId
		});
		ElMessage.success('目标计划已保存');
		planDialogVisible.value = false;
		await Promise.all([loadPlanPage(), loadTodayPlans(), loadOverview(), loadTrendPlans()]);
	} catch (error: unknown) {
		showElementErrorFromError(error, '目标计划保存失败');
	} finally {
		planSubmitLoading.value = false;
	}
}

async function handleDeletePlan(row: GoalOpsPlanRecord) {
	if (!row.id) {
		return;
	}

	const confirmed = await confirmElementAction(`确认删除目标“${row.title}”吗？`, '删除目标计划');

	if (!confirmed) {
		return;
	}

	await runTrackedElementAction({
		rowId: Number(row.id),
		actionType: 'deletePlan',
		request: () =>
			performanceGoalService.deleteOpsPlan({
				ids: [Number(row.id)]
			}),
		successMessage: '目标计划已删除',
		errorMessage: '目标计划删除失败',
		refresh: async () => {
			await Promise.all([loadPlanPage(), loadTodayPlans(), loadOverview(), loadTrendPlans()]);
		}
	});
}

function canDeletePlan(row: GoalOpsPlanRecord) {
	if (row.sourceType === 'public') {
		return canManageDepartmentView.value || hasCompanyGoalScope.value;
	}
	return (
		(canCreatePersonalPlan.value &&
			Number(row.employeeId) === Number(currentUserId.value || 0)) ||
		hasCompanyGoalScope.value
	);
}

function canEditPlan(row: GoalOpsPlanRecord) {
	if (row.sourceType === 'public') {
		return canManageDepartmentView.value || hasCompanyGoalScope.value;
	}
	return (
		(canCreatePersonalPlan.value &&
			Number(row.employeeId) === Number(currentUserId.value || 0)) ||
		hasCompanyGoalScope.value
	);
}

function handlePlanTypeChange() {
	if (planForm.periodType === 'day') {
		const date = planForm.planDate || filters.planDate;
		planForm.planDate = date;
		planForm.periodStartDate = date;
		planForm.periodEndDate = date;
		return;
	}

	planForm.planDate = '';
	if (!planForm.periodStartDate || !planForm.periodEndDate) {
		planForm.periodStartDate = filters.planDate;
		planForm.periodEndDate = filters.planDate;
	}
}

async function handlePlanFilterChange() {
	Object.assign(goalPlanList.filters, planFilters);
	await goalPlanList.search();
}

async function handlePlanPageChange(page: number) {
	await goalPlanList.goToPage(page);
}

function normalizePlanList(result: GoalOpsPlanPageResult) {
	return (result.list || []).map(item => ({
		...item,
		targetValue: Number(item.targetValue || 0),
		actualValue: Number(item.actualValue || 0),
		completionRate: Number(item.completionRate || 0)
	}));
}

function buildTrendRows(list: GoalOpsPlanRecord[]): GoalOpsTrendRow[] {
	const grouped = new Map<string, GoalOpsTrendRow>();

	for (const item of list) {
		const planDate = String(item.planDate || '');
		if (!planDate) {
			continue;
		}

		const current = grouped.get(planDate) || {
			planDate,
			publicActualValue: 0,
			personalActualValue: 0,
			totalActualValue: 0,
			totalTargetValue: 0,
			completionRate: 0
		};

		const targetValue = Number(item.targetValue || 0);
		const actualValue = Number(item.actualValue || 0);

		current.totalTargetValue += targetValue;
		current.totalActualValue += actualValue;

		if (item.sourceType === 'public') {
			current.publicActualValue += actualValue;
		} else {
			current.personalActualValue += actualValue;
		}

		current.completionRate =
			current.totalTargetValue > 0
				? Number(
						Math.min(
							(current.totalActualValue / current.totalTargetValue) * 100,
							100
						).toFixed(2)
					)
				: 0;

		grouped.set(planDate, current);
	}

	return Array.from(grouped.values()).sort((left, right) =>
		left.planDate.localeCompare(right.planDate)
	);
}

function sourceTypeLabel(value?: GoalOpsSourceType) {
	return dict.getLabel(GOAL_SOURCE_TYPE_DICT_KEY, value) || value || '-';
}

function periodTypeLabel(value?: GoalOpsPeriodType) {
	return dict.getLabel(GOAL_PERIOD_TYPE_DICT_KEY, value) || value || '-';
}

function planStatusLabel(value?: GoalOpsPlanStatus) {
	return dict.getLabel(GOAL_PLAN_STATUS_DICT_KEY, value) || value || '-';
}

function planStatusTagType(value?: GoalOpsPlanStatus) {
	return dict.getMeta(GOAL_PLAN_STATUS_DICT_KEY, value)?.tone || 'info';
}

function reportStatusLabel(value?: GoalOpsReportStatus) {
	return dict.getLabel(GOAL_REPORT_STATUS_DICT_KEY, value) || value || '未生成';
}

function reportStatusTagType(value?: GoalOpsReportStatus) {
	return dict.getMeta(GOAL_REPORT_STATUS_DICT_KEY, value)?.tone || 'info';
}

function formatPercent(value: number) {
	return `${Number(value || 0).toFixed(2)}%`;
}

function formatNumber(value: number) {
	return Number(value || 0).toFixed(2);
}

function normalizeNumber(value: unknown) {
	const normalized = Number(value || 0);
	return Number.isFinite(normalized) && normalized > 0 ? normalized : undefined;
}

function isMissingDailyReportError(error: unknown) {
	return resolveErrorMessage(error, '').includes('日报不存在');
}

function formatDate(value: Date) {
	const year = value.getFullYear();
	const month = String(value.getMonth() + 1).padStart(2, '0');
	const day = String(value.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function offsetDate(baseDate: string, offset: number) {
	const date = new Date(`${baseDate}T00:00:00`);
	date.setDate(date.getDate() + offset);
	return formatDate(date);
}
</script>

<style scoped lang="scss">
.goal-ops-page {
	--goal-ops-bg: var(--app-surface-card);
	--goal-ops-panel: var(--app-surface-muted);
	--goal-ops-line: var(--app-border-soft);
	--goal-ops-text: var(--app-text-primary);
	--goal-ops-muted: var(--app-text-secondary);
	--goal-ops-accent: var(--app-accent-warm);
	--goal-ops-accent-soft: var(--app-accent-warm-soft);
	--goal-ops-accent-text: var(--app-accent-warm-text);
	--goal-ops-primary-bg: var(--app-surface-primary);
	--goal-ops-primary-text: var(--app-text-on-primary);
	--goal-ops-primary-muted: var(--app-text-on-primary-muted);
	--goal-ops-shadow: var(--app-shadow-surface);

	display: flex;
	flex-direction: column;
	gap: var(--app-space-4);
	padding-bottom: var(--app-space-6);
	color: var(--goal-ops-text);
}

.goal-ops-page :deep(.el-card) {
	border: 1px solid var(--goal-ops-line);
}

.goal-ops-page__hero,
.goal-ops-page__section {
	background: var(--goal-ops-bg);
	box-shadow: var(--goal-ops-shadow);
}

.goal-ops-page__hero-top,
.goal-ops-page__toolbar,
.goal-ops-page__section-header,
.goal-ops-page__panel-header,
.goal-ops-page__actions,
.goal-ops-page__sub-toolbar,
.goal-ops-page__hero-tags {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--app-space-3);
	flex-wrap: wrap;
}

.goal-ops-page__hero h1,
.goal-ops-page__section-header h2,
.goal-ops-page__panel-header h3 {
	margin: 0;
}

.goal-ops-page__hero p,
.goal-ops-page__section-header p,
.goal-ops-page__panel-header p {
	margin: 6px 0 0;
	color: var(--goal-ops-muted);
	line-height: 1.6;
}

.goal-ops-page__eyebrow {
	margin-bottom: 8px;
	color: var(--goal-ops-accent);
	font-size: var(--app-font-size-caption);
	font-weight: 700;
	letter-spacing: 0.12em;
	text-transform: uppercase;
}

.goal-ops-page__toolbar-left,
.goal-ops-page__toolbar-right {
	display: flex;
	flex-wrap: wrap;
	gap: var(--app-space-3);
}

.goal-ops-page__summary {
	margin: 0;
}

.goal-ops-page__metric {
	min-height: 132px;
	background: var(--goal-ops-panel);
	box-shadow: var(--goal-ops-shadow);
}

.goal-ops-page__metric--primary {
	background: var(--goal-ops-primary-bg);
	color: var(--goal-ops-primary-text);
}

.goal-ops-page__metric--primary .goal-ops-page__metric-meta,
.goal-ops-page__metric--primary .goal-ops-page__metric-label {
	color: var(--goal-ops-primary-muted);
}

.goal-ops-page__metric-label {
	font-size: 13px;
	color: var(--goal-ops-muted);
}

.goal-ops-page__metric-value {
	margin-top: 16px;
	font-size: 32px;
	font-weight: 700;
	line-height: 1;
}

.goal-ops-page__metric-meta {
	margin-top: 14px;
	color: var(--goal-ops-muted);
	font-size: 13px;
}

.goal-ops-page__panel {
	height: 100%;
	background: var(--goal-ops-panel);
}

.goal-ops-page__stack {
	display: flex;
	flex-direction: column;
	gap: var(--app-space-4);
	height: 100%;
}

.goal-ops-page__inline-unit {
	margin-left: 8px;
	color: var(--goal-ops-muted);
	font-size: 12px;
}

.goal-ops-page__mini-stats,
.goal-ops-page__summary-grid,
.goal-ops-page__report-summary,
.goal-ops-page__report-kpis {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: var(--app-space-3);
	margin-bottom: var(--app-space-4);
}

.goal-ops-page__summary-grid {
	grid-template-columns: repeat(2, minmax(0, 1fr));
	margin-top: var(--app-space-4);
	margin-bottom: 0;
}

.goal-ops-page__mini-stat,
.goal-ops-page__summary-grid > div,
.goal-ops-page__report-summary > div,
.goal-ops-page__report-kpis > div {
	padding: 12px 14px;
	border-radius: var(--app-radius-md);
	background: var(--app-surface-card);
	border: 1px solid var(--goal-ops-line);
}

.goal-ops-page__mini-stat span,
.goal-ops-page__summary-grid label,
.goal-ops-page__report-summary span,
.goal-ops-page__report-kpis label {
	display: block;
	color: var(--goal-ops-muted);
	font-size: 12px;
}

.goal-ops-page__mini-stat strong,
.goal-ops-page__summary-grid strong,
.goal-ops-page__report-summary strong,
.goal-ops-page__report-kpis strong {
	display: block;
	margin-top: 6px;
	font-size: 18px;
}

.goal-ops-page__progress-cell {
	display: flex;
	align-items: center;
	gap: 10px;
}

.goal-ops-page__split-row {
	margin-top: 16px;
}

.goal-ops-page__config-form {
	max-width: 520px;
}

.goal-ops-page__pagination {
	display: flex;
	justify-content: flex-end;
	margin-top: 16px;
}

.goal-ops-page__subheading {
	margin: 0 0 12px;
	font-size: 14px;
}

.goal-ops-page__rank-list,
.goal-ops-page__zero-list {
	margin: 0;
	padding: 0;
	list-style: none;
}

.goal-ops-page__rank-list li,
.goal-ops-page__zero-list li {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 0;
	border-bottom: 1px dashed var(--goal-ops-line);
}

.goal-ops-page__rank-list li:last-child,
.goal-ops-page__zero-list li:last-child {
	border-bottom: 0;
}

.goal-ops-page__remark {
	margin-top: 12px;
	padding: 12px 14px;
	border-radius: 12px;
	background: var(--goal-ops-accent-soft);
	color: var(--goal-ops-accent-text);
	line-height: 1.6;
}

@media (max-width: 1200px) {
	.goal-ops-page__mini-stats,
	.goal-ops-page__report-summary,
	.goal-ops-page__report-kpis {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}

@media (max-width: 768px) {
	.goal-ops-page__mini-stats,
	.goal-ops-page__summary-grid,
	.goal-ops-page__report-summary,
	.goal-ops-page__report-kpis {
		grid-template-columns: minmax(0, 1fr);
	}
}
</style>
