<!-- 文件职责：承接主题19班主任资源列表、详情、新增编辑、负责人分配、跟进记录与合作动作主链；不负责后端数据范围裁剪、代理/绩效扩展或附件链路；依赖 teacherInfo/teacherFollow/teacherCooperation service、基础用户部门选项和路由预置参数；维护重点是只读态、合作状态门禁和建班前置条件必须与冻结契约一致。 -->
<template>
	<permission-overlay
		:denied="!canAccess"
		:permission-key="performanceTeacherInfoService.permission.page"
		title="当前账号暂未开通班主任资源页权限"
		description="页面内容已切换到保护态。请联系管理员按岗位开通班主任资源查看权限。"
	>
		<div class="teacher-channel-teacher-page">
		<el-card shadow="never" class="teacher-channel-teacher-page__toolbar-card">
			<div class="teacher-channel-teacher-page__toolbar">
				<div class="teacher-channel-teacher-page__toolbar-left">
					<el-input
						v-model="filters.keyword"
						placeholder="班主任 / 学校 / 学科"
						clearable
						style="width: 240px"
						@keyup.enter="handleSearch"
					/>
					<el-select
						v-model="filters.cooperationStatus"
						placeholder="合作状态"
						clearable
						style="width: 180px"
					>
						<el-option
							v-for="item in cooperationStatusOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
					<el-select
						v-model="filterDepartmentIdModel"
						placeholder="归属部门"
						clearable
						filterable
						style="width: 200px"
					>
						<el-option
							v-for="item in departmentOptions"
							:key="item.id"
							:label="item.label"
							:value="item.id"
						/>
					</el-select>
				</div>

				<div class="teacher-channel-teacher-page__toolbar-right">
					<el-button @click="handleSearch">查询</el-button>
					<el-button @click="handleReset">重置</el-button>
					<el-button v-if="showAgentPageButton" @click="openAgentCenter">
						代理主体
					</el-button>
					<el-button v-if="showConflictPageButton" @click="openConflictCenter">
						冲突处理
					</el-button>
					<el-button v-if="showAuditPageButton" @click="openAuditCenter">
						审计留痕
					</el-button>
					<el-button v-if="showAddButton" type="primary" @click="openCreate">
						新增班主任
					</el-button>
				</div>
			</div>
		</el-card>

		<el-card shadow="never" class="teacher-channel-teacher-page__content-card">
			<template #header>
				<div class="teacher-channel-teacher-page__header">
					<div class="teacher-channel-teacher-page__header-main">
						<h2>班主任资源列表</h2>
						<el-tag effect="plain">主题 19</el-tag>
						<el-tag effect="plain" type="info">{{ roleFact.roleLabel }}</el-tag>
						<el-tag effect="plain" :type="teacherCapabilityTagType">
							{{ teacherCapabilityLabel }}
						</el-tag>
					</div>
					<el-alert
						:title="
							isReadOnlyRole
								? '当前账号没有主题19任何写权限，页面仅展示授权范围数据，联系方式按后端返回值展示。'
								: '未至少跟进一次前不可标记合作；仅 partnered 可建班；terminated 不可再建班。'
						"
						:type="isReadOnlyRole ? 'info' : 'warning'"
						:closable="false"
						show-icon
					/>
				</div>
			</template>

			<el-alert
				v-if="pageError"
				class="teacher-channel-teacher-page__error"
				type="warning"
				:title="pageError"
				:closable="false"
				show-icon
			/>

			<el-table :data="rows" border v-loading="tableLoading">
				<el-table-column prop="teacherName" label="班主任" min-width="140" />
				<el-table-column prop="schoolName" label="学校" min-width="180">
					<template #default="{ row }">
						{{ row.schoolName || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="subject" label="学科" min-width="120">
					<template #default="{ row }">
						{{ row.subject || '-' }}
					</template>
				</el-table-column>
				<el-table-column
					prop="projectTags"
					label="项目标签"
					min-width="170"
					show-overflow-tooltip
				>
					<template #default="{ row }">
						{{ stringifyTagList(row.projectTags) }}
					</template>
				</el-table-column>
				<el-table-column prop="phone" label="联系电话" min-width="150">
					<template #default="{ row }">
						{{ row.phone || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="wechat" label="微信" min-width="150">
					<template #default="{ row }">
						{{ row.wechat || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="ownerEmployeeName" label="负责人" min-width="130">
					<template #default="{ row }">
						{{ row.ownerEmployeeName || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="nextFollowTime" label="下次跟进时间" min-width="170">
					<template #default="{ row }">
						{{ row.nextFollowTime || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="cooperationStatus" label="合作状态" width="120">
					<template #default="{ row }">
						<el-tag :type="cooperationStatusTagType(row.cooperationStatus)">
							{{ cooperationStatusLabel(row.cooperationStatus) }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="classCount" label="班级数" width="90">
					<template #default="{ row }">
						{{ Number(row.classCount || 0) }}
					</template>
				</el-table-column>
				<el-table-column prop="updateTime" label="更新时间" min-width="170" />
				<el-table-column label="操作" fixed="right" min-width="320">
					<template #default="{ row }">
						<el-button v-if="showInfoButton" text @click="openDetailFromRow(row)"
							>详情</el-button
						>
						<el-button v-if="canEdit(row)" text type="primary" @click="openEdit(row)">
							编辑
						</el-button>
						<el-button
							v-if="canAssign(row)"
							text
							type="warning"
							@click="openAssign(row)"
						>
							分配
						</el-button>
						<el-button
							v-if="showFollowEntry(row)"
							text
							type="success"
							@click="openDetailFromRow(row, { focusFollow: true })"
						>
							跟进
						</el-button>
						<el-button
							v-if="canMark(row)"
							text
							type="success"
							@click="handleMarkCooperation(row)"
						>
							标记合作
						</el-button>
						<el-button
							v-if="canCreateClass(row)"
							text
							type="primary"
							@click="goCreateClass(row)"
						>
							新建班级
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<el-empty
				v-if="!tableLoading && rows.length === 0"
				description="当前筛选条件下暂无班主任资源"
			/>

			<div class="teacher-channel-teacher-page__pagination">
				<el-pagination
					background
					layout="total, prev, pager, next"
					:current-page="pagination.page"
					:page-size="pagination.size"
					:total="pagination.total"
					@current-change="changePage"
				/>
			</div>
		</el-card>

		<el-drawer v-model="detailVisible" title="班主任详情" size="920px" destroy-on-close>
			<div v-loading="detailLoading" class="teacher-channel-teacher-page__drawer">
				<el-alert
					v-if="detailTeacher"
					:title="detailAlertMessage"
					:type="isReadOnlyRole ? 'info' : 'warning'"
					:closable="false"
					show-icon
				/>

				<el-descriptions v-if="detailTeacher" :column="2" border>
					<el-descriptions-item label="班主任">
						{{ detailTeacher.teacherName }}
					</el-descriptions-item>
					<el-descriptions-item label="合作状态">
						<el-tag
							:type="cooperationStatusTagType(detailTeacher.cooperationStatus)"
						>
							{{ cooperationStatusLabel(detailTeacher.cooperationStatus) }}
						</el-tag>
					</el-descriptions-item>
					<el-descriptions-item label="联系电话">
						{{ detailTeacher.phone || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="微信">
						{{ detailTeacher.wechat || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="学校">
						{{ detailTeacher.schoolName || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="区域">
						{{ detailTeacher.schoolRegion || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="学校类型">
						{{ detailTeacher.schoolType || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="年级 / 班级">
						{{ detailTeacher.grade || '-' }} / {{ detailTeacher.className || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="学科">
						{{ detailTeacher.subject || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="负责人">
						{{ detailTeacher.ownerEmployeeName || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="项目标签" :span="2">
						{{ stringifyTagList(detailTeacher.projectTags) }}
					</el-descriptions-item>
					<el-descriptions-item label="意向等级">
						{{ detailTeacher.intentionLevel || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="沟通风格">
						{{ detailTeacher.communicationStyle || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="上次跟进">
						{{ detailTeacher.lastFollowTime || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="下次跟进">
						{{ detailTeacher.nextFollowTime || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="合作时间">
						{{ detailTeacher.cooperationTime || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="班级数">
						{{ Number(detailTeacher.classCount || 0) }}
					</el-descriptions-item>
				</el-descriptions>

				<div v-if="detailTeacher" class="teacher-channel-teacher-page__detail-actions">
					<el-button
						v-if="canAdvanceNegotiating(detailTeacher)"
						type="warning"
						:loading="detailActionLoading === 'negotiating'"
						@click="handleUpdateStatus(detailTeacher, 'negotiating')"
					>
						推进为洽谈中
					</el-button>
					<el-button
						v-if="canMark(detailTeacher)"
						type="success"
						:loading="detailActionLoading === 'partnered'"
						@click="handleMarkCooperation(detailTeacher)"
					>
						标记合作
					</el-button>
					<el-button
						v-if="canTerminate(detailTeacher)"
						type="danger"
						:loading="detailActionLoading === 'terminated'"
						@click="handleUpdateStatus(detailTeacher, 'terminated')"
					>
						终止合作
					</el-button>
					<el-button
						v-if="canCreateClass(detailTeacher)"
						type="primary"
						@click="goCreateClass(detailTeacher)"
					>
						为该班主任建班
					</el-button>
				</div>

				<section v-if="detailTeacher" class="teacher-channel-teacher-page__follow-section">
					<div class="teacher-channel-teacher-page__section-header">
						<div>
							<h3>代理归因</h3>
							<p>当前归因、冲突态和历史都以后端返回结果为准，不在前端伪造生效态。</p>
						</div>
						<el-tag effect="plain">
							{{ attributionInfo?.openConflictCount || 0 }} 个待处理冲突
						</el-tag>
					</div>

					<el-alert
						v-if="attributionError"
						type="warning"
						:title="attributionError"
						:closable="false"
						show-icon
					/>

					<el-alert
						v-if="!showAttributionInfoButton"
						type="info"
						title="当前账号暂无代理归因详情与历史权限，已隐藏归因明细。"
						:closable="false"
						show-icon
					/>
					<template v-else>
						<el-descriptions v-if="attributionInfo?.currentAttribution" :column="2" border>
							<el-descriptions-item label="当前归因">
								{{ attributionInfo.currentAttribution.agentName || '直营' }}
							</el-descriptions-item>
							<el-descriptions-item label="归因状态">
								<el-tag
									:type="
										attributionInfo.currentAttribution.status === 'active'
											? 'success'
											: attributionInfo.currentAttribution.status === 'conflicted'
												? 'warning'
												: 'info'
									"
								>
									{{ attributionInfo.currentAttribution.status || '-' }}
								</el-tag>
							</el-descriptions-item>
							<el-descriptions-item label="归因类型">
								{{ attributionInfo.currentAttribution.attributionType || '-' }}
							</el-descriptions-item>
							<el-descriptions-item label="生效时间">
								{{ attributionInfo.currentAttribution.effectiveTime || '-' }}
							</el-descriptions-item>
							<el-descriptions-item label="来源类型">
								{{ attributionInfo.currentAttribution.sourceType || '-' }}
							</el-descriptions-item>
							<el-descriptions-item label="操作人">
								{{ attributionInfo.currentAttribution.operatorName || '-' }}
							</el-descriptions-item>
							<el-descriptions-item label="来源说明" :span="2">
								{{ attributionInfo.currentAttribution.sourceRemark || '-' }}
							</el-descriptions-item>
						</el-descriptions>
						<el-empty
							v-else
							description="当前班主任尚未建立代理归因，可在下方选择代理主体发起归因。"
						/>
					</template>

					<el-form
						v-if="showAttributionWriteActions && detailTeacher"
						:model="attributionForm"
						label-width="100px"
						class="teacher-channel-teacher-page__follow-form"
					>
						<el-row :gutter="16">
							<el-col :span="10">
								<el-form-item label="代理主体">
									<el-select
										v-model="attributionAgentModel"
										clearable
										filterable
										placeholder="留空表示直营"
										style="width: 100%"
									>
											<el-option
												v-for="item in attributionAgentOptions"
												:key="item.id"
												:label="item.name"
												:value="Number(item.id || 0)"
											/>
									</el-select>
								</el-form-item>
							</el-col>
							<el-col :span="10">
								<el-form-item label="归因说明">
									<el-input
										v-model="attributionForm.sourceRemark"
										maxlength="200"
										show-word-limit
									/>
								</el-form-item>
							</el-col>
							<el-col :span="4">
								<el-form-item label-width="0">
									<el-button
										type="primary"
										:loading="attributionLoading === 'assign'"
										@click="submitAttribution('assign')"
									>
										建立归因
									</el-button>
								</el-form-item>
							</el-col>
						</el-row>
						<div class="teacher-channel-teacher-page__detail-actions">
							<el-button
								type="warning"
								:loading="attributionLoading === 'change'"
								@click="submitAttribution('change')"
							>
								调整归因
							</el-button>
							<el-button
								type="danger"
								:loading="attributionLoading === 'remove'"
								@click="submitAttribution('remove')"
							>
								移除归因
							</el-button>
						</div>
					</el-form>

					<el-table
						v-if="showAttributionInfoButton"
						:data="attributionHistoryRows"
						border
						v-loading="attributionHistoryLoading"
					>
						<el-table-column prop="createTime" label="记录时间" min-width="170" />
						<el-table-column prop="agentName" label="归因主体" min-width="160">
							<template #default="{ row }">
								{{ row.agentName || '直营' }}
							</template>
						</el-table-column>
						<el-table-column prop="status" label="状态" width="120" />
						<el-table-column prop="sourceType" label="来源" width="120" />
						<el-table-column prop="operatorName" label="操作人" min-width="130" />
						<el-table-column prop="sourceRemark" label="说明" min-width="220" show-overflow-tooltip />
					</el-table>
				</section>

				<section class="teacher-channel-teacher-page__follow-section">
					<div class="teacher-channel-teacher-page__section-header">
						<div>
							<h3>跟进记录</h3>
							<p>首批只展示时间线和新增跟进，不扩展附件或截图原文。</p>
						</div>
						<el-tag effect="plain"> {{ followRows.length }} 条 </el-tag>
					</div>

					<el-alert
						v-if="followError"
						type="warning"
						:title="followError"
						:closable="false"
						show-icon
					/>

					<el-form
						v-if="showFollowAddButton && detailTeacher"
						ref="followFormRef"
						:model="followForm"
						:rules="followRules"
						label-width="110px"
						class="teacher-channel-teacher-page__follow-form"
					>
						<el-row :gutter="16">
							<el-col :span="16">
								<el-form-item label="跟进内容" prop="content">
									<el-input
										v-model="followForm.content"
										type="textarea"
										:rows="3"
										maxlength="500"
										show-word-limit
										placeholder="请输入跟进内容"
									/>
								</el-form-item>
							</el-col>
							<el-col :span="8">
								<el-form-item label="下次跟进时间">
									<el-date-picker
										v-model="followNextFollowTimeModel"
										type="datetime"
										value-format="YYYY-MM-DD HH:mm:ss"
										placeholder="可选"
										style="width: 100%"
									/>
								</el-form-item>
								<el-form-item label-width="0">
									<el-button
										type="primary"
										:loading="followSubmitLoading"
										@click="submitFollow"
									>
										新增跟进
									</el-button>
								</el-form-item>
							</el-col>
						</el-row>
					</el-form>

					<el-table :data="followRows" border v-loading="followLoading">
						<el-table-column prop="createTime" label="时间" min-width="170">
							<template #default="{ row }">
								{{ row.createTime || '-' }}
							</template>
						</el-table-column>
						<el-table-column label="操作人" min-width="130">
							<template #default="{ row }">
								{{ resolveFollowOperator(row) }}
							</template>
						</el-table-column>
						<el-table-column label="跟进内容" min-width="300" show-overflow-tooltip>
							<template #default="{ row }">
								{{ resolveFollowContent(row) }}
							</template>
						</el-table-column>
						<el-table-column prop="nextFollowTime" label="下次跟进时间" min-width="170">
							<template #default="{ row }">
								{{ row.nextFollowTime || '-' }}
							</template>
						</el-table-column>
					</el-table>

					<el-empty
						v-if="!followLoading && followRows.length === 0"
						description="当前班主任暂无跟进记录"
					/>
				</section>
			</div>
		</el-drawer>

		<el-dialog
			v-model="formVisible"
			:title="editingTeacher?.id ? '编辑班主任资源' : '新增班主任资源'"
			width="860px"
			destroy-on-close
		>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
				<el-alert
					:title="
						editingTeacher?.id
							? '编辑仅维护基础资料，不在此处直接修改合作终态。'
							: '新增资源默认保存为 uncontacted。'
					"
					:type="editingTeacher?.id ? 'warning' : 'info'"
					:closable="false"
					show-icon
				/>
				<el-row :gutter="16">
					<el-col :span="12">
						<el-form-item label="班主任姓名" prop="teacherName">
							<el-input v-model="form.teacherName" maxlength="100" show-word-limit />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="学校名称" prop="schoolName">
							<el-input v-model="form.schoolName" maxlength="100" show-word-limit />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="联系电话">
							<el-input v-model="form.phone" maxlength="50" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="微信">
							<el-input v-model="form.wechat" maxlength="100" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="区域">
							<el-input v-model="form.schoolRegion" maxlength="100" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="学校类型">
							<el-input v-model="form.schoolType" maxlength="100" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="年级">
							<el-input v-model="form.grade" maxlength="50" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="班级名称">
							<el-input v-model="form.className" maxlength="100" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="学科">
							<el-input v-model="form.subject" maxlength="50" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="下次跟进时间">
							<el-date-picker
								v-model="formNextFollowTimeModel"
								type="datetime"
								value-format="YYYY-MM-DD HH:mm:ss"
								placeholder="可选"
								style="width: 100%"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="意向等级">
							<el-input v-model="form.intentionLevel" maxlength="50" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="沟通风格">
							<el-input v-model="form.communicationStyle" maxlength="100" />
						</el-form-item>
					</el-col>
					<el-col :span="24">
						<el-form-item label="项目标签">
							<el-input
								v-model="projectTagsText"
								type="textarea"
								:rows="2"
								placeholder="多个标签用逗号分隔"
							/>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>

			<template #footer>
				<el-button @click="formVisible = false">取消</el-button>
				<el-button type="primary" :loading="submitLoading" @click="submitForm">
					保存
				</el-button>
			</template>
		</el-dialog>

		<el-dialog v-model="assignVisible" title="分配负责人" width="520px" destroy-on-close>
			<el-form
				ref="assignFormRef"
				:model="assignForm"
				:rules="assignRules"
				label-width="90px"
			>
				<el-form-item label="负责人" prop="ownerEmployeeId">
					<el-select
						v-model="assignOwnerModel"
						filterable
						style="width: 100%"
						placeholder="请选择负责人"
					>
						<el-option
							v-for="item in userOptions"
							:key="item.id"
							:label="item.name"
							:value="item.id"
						/>
					</el-select>
				</el-form-item>
			</el-form>

			<template #footer>
				<el-button @click="assignVisible = false">取消</el-button>
				<el-button type="primary" :loading="assignLoading" @click="submitAssign">
					确认分配
				</el-button>
			</template>
		</el-dialog>

		<el-dialog v-model="agentCenterVisible" title="代理主体与关系维护" width="1180px" destroy-on-close>
			<div class="teacher-channel-teacher-page__drawer">
				<div class="teacher-channel-teacher-page__section-header">
					<div>
						<h3>代理主体</h3>
						<p>停用或黑名单代理不可作为新归因目标。</p>
					</div>
					<el-button v-if="showAgentAddButton" type="primary" @click="openAgentForm()">
						新增代理主体
					</el-button>
				</div>
				<el-table :data="agentRows" border v-loading="agentLoading">
					<el-table-column prop="name" label="名称" min-width="160" />
					<el-table-column prop="agentType" label="类型" width="120" />
					<el-table-column prop="level" label="等级" width="100" />
					<el-table-column prop="region" label="区域" min-width="120" />
					<el-table-column prop="status" label="状态" width="100" />
					<el-table-column prop="blacklistStatus" label="黑名单" width="100" />
					<el-table-column label="操作" fixed="right" min-width="240">
						<template #default="{ row }">
							<el-button v-if="showAgentUpdateButton" text @click="openAgentForm(row)">
								编辑
							</el-button>
							<el-button
								v-if="showAgentUpdateStatusButton"
								text
								type="warning"
								@click="toggleAgentStatus(row)"
							>
								{{ row.status === 'active' ? '停用' : '启用' }}
							</el-button>
							<el-button
								v-if="showAgentBlacklistButton && row.blacklistStatus !== 'blacklisted'"
								text
								type="danger"
								@click="toggleAgentBlacklist(row, true)"
							>
								拉黑
							</el-button>
							<el-button
								v-if="showAgentBlacklistButton && row.blacklistStatus === 'blacklisted'"
								text
								type="success"
								@click="toggleAgentBlacklist(row, false)"
							>
								解黑
							</el-button>
						</template>
					</el-table-column>
				</el-table>

				<div class="teacher-channel-teacher-page__section-header">
					<div>
						<h3>代理关系</h3>
						<p>新增或编辑关系时，前后端都要求防止循环代理树。</p>
					</div>
					<el-button v-if="showAgentRelationAddButton" @click="openRelationForm()">
						新增关系
					</el-button>
				</div>
				<el-table :data="relationRows" border v-loading="relationLoading">
					<el-table-column prop="parentAgentName" label="父级代理" min-width="160" />
					<el-table-column prop="childAgentName" label="子级代理" min-width="160" />
					<el-table-column prop="status" label="状态" width="100" />
					<el-table-column prop="effectiveTime" label="生效时间" min-width="170" />
					<el-table-column prop="remark" label="备注" min-width="220" show-overflow-tooltip />
					<el-table-column label="操作" fixed="right" min-width="160">
						<template #default="{ row }">
							<el-button v-if="showAgentRelationUpdateButton" text @click="openRelationForm(row)">
								编辑
							</el-button>
							<el-button
								v-if="showAgentRelationDeleteButton"
								text
								type="danger"
								@click="removeRelation(row)"
							>
								失效
							</el-button>
						</template>
					</el-table-column>
				</el-table>
			</div>
		</el-dialog>

		<el-dialog
			v-model="conflictCenterVisible"
			title="归因冲突处理"
			width="1100px"
			destroy-on-close
		>
			<div class="teacher-channel-teacher-page__drawer">
				<el-table :data="conflictRows" border v-loading="conflictLoading">
					<el-table-column prop="teacherName" label="班主任" min-width="150" />
					<el-table-column prop="status" label="状态" width="110" />
					<el-table-column prop="currentAgentId" label="当前主体" min-width="120" />
					<el-table-column prop="requestedAgentId" label="申请主体" min-width="120" />
					<el-table-column prop="resolutionRemark" label="说明" min-width="220" show-overflow-tooltip />
					<el-table-column label="操作" fixed="right" min-width="150">
						<template #default="{ row }">
							<el-button text @click="openConflictDetail(row)">详情</el-button>
						</template>
					</el-table-column>
				</el-table>
			</div>
		</el-dialog>

		<el-dialog
			v-model="conflictDetailVisible"
			title="冲突详情"
			width="720px"
			destroy-on-close
		>
			<div v-if="conflictDetail" class="teacher-channel-teacher-page__drawer">
				<el-descriptions :column="2" border>
					<el-descriptions-item label="班主任">
						{{ conflictDetail.teacherName || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="状态">
						{{ conflictDetail.status || '-' }}
					</el-descriptions-item>
					<el-descriptions-item label="当前主体">
						{{ conflictDetail.currentAgentName || '直营' }}
					</el-descriptions-item>
					<el-descriptions-item label="申请主体">
						{{ conflictDetail.requestedAgentName || '直营' }}
					</el-descriptions-item>
					<el-descriptions-item label="说明" :span="2">
						{{ conflictDetail.resolutionRemark || '-' }}
					</el-descriptions-item>
				</el-descriptions>
				<el-form v-if="showConflictResolveButton" :model="conflictResolveForm" label-width="100px">
					<el-form-item label="胜出主体">
						<el-select
							v-model="conflictResolveAgentModel"
							clearable
							filterable
							placeholder="留空表示直营"
							style="width: 100%"
						>
							<el-option
								v-for="item in attributionAgentOptions"
								:key="item.id"
								:label="item.name"
								:value="Number(item.id || 0)"
							/>
						</el-select>
					</el-form-item>
					<el-form-item label="处理说明">
						<el-input v-model="conflictResolveForm.resolutionRemark" maxlength="200" show-word-limit />
					</el-form-item>
				</el-form>
			</div>
			<template #footer>
				<el-button @click="conflictDetailVisible = false">关闭</el-button>
				<el-button
					v-if="showConflictResolveButton"
					type="warning"
					:loading="conflictResolveLoading === 'cancelled'"
					@click="submitConflictResolve('cancelled')"
				>
					取消冲突
				</el-button>
				<el-button
					v-if="showConflictResolveButton"
					type="primary"
					:loading="conflictResolveLoading === 'resolved'"
					@click="submitConflictResolve('resolved')"
				>
					确认胜出
				</el-button>
			</template>
		</el-dialog>

		<el-dialog v-model="auditCenterVisible" title="代理体系审计" width="1100px" destroy-on-close>
			<el-table :data="auditRows" border v-loading="auditLoading">
				<el-table-column prop="createTime" label="时间" min-width="170" />
				<el-table-column prop="resourceType" label="资源类型" width="150" />
				<el-table-column prop="action" label="动作" width="140" />
				<el-table-column prop="operatorName" label="操作人" width="120" />
				<el-table-column prop="resourceId" label="资源 ID" width="100" />
			</el-table>
		</el-dialog>

		<el-dialog
			v-model="agentFormVisible"
			:title="agentEditingRecord?.id ? '编辑代理主体' : '新增代理主体'"
			width="620px"
			destroy-on-close
		>
			<el-form :model="agentForm" label-width="100px">
				<el-form-item label="名称">
					<el-input v-model="agentForm.name" maxlength="100" />
				</el-form-item>
				<el-form-item label="类型">
					<el-select v-model="agentForm.agentType" style="width: 100%">
						<el-option label="机构代理" value="institution" />
						<el-option label="个人代理" value="individual" />
						<el-option label="直营" value="direct" />
					</el-select>
				</el-form-item>
				<el-form-item label="等级">
					<el-input v-model="agentForm.level" maxlength="30" />
				</el-form-item>
				<el-form-item label="区域">
					<el-input v-model="agentForm.region" maxlength="50" />
				</el-form-item>
				<el-form-item label="备注">
					<el-input v-model="agentForm.remark" type="textarea" :rows="3" maxlength="200" show-word-limit />
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="agentFormVisible = false">取消</el-button>
				<el-button type="primary" :loading="agentFormLoading" @click="submitAgentForm">
					保存
				</el-button>
			</template>
		</el-dialog>

		<el-dialog
			v-model="relationFormVisible"
			:title="relationEditingRecord?.id ? '编辑代理关系' : '新增代理关系'"
			width="620px"
			destroy-on-close
		>
			<el-form :model="relationForm" label-width="100px">
				<el-form-item label="父级代理">
						<el-select v-model="relationParentAgentModel" filterable style="width: 100%">
							<el-option v-for="item in relationAgentOptions" :key="item.id" :label="item.name" :value="Number(item.id || 0)" />
						</el-select>
					</el-form-item>
					<el-form-item label="子级代理">
						<el-select v-model="relationChildAgentModel" filterable style="width: 100%">
							<el-option v-for="item in relationAgentOptions" :key="item.id" :label="item.name" :value="Number(item.id || 0)" />
						</el-select>
					</el-form-item>
				<el-form-item label="生效时间">
					<el-date-picker
						v-model="relationEffectiveTimeModel"
						type="datetime"
						value-format="YYYY-MM-DD HH:mm:ss"
						style="width: 100%"
					/>
				</el-form-item>
				<el-form-item label="备注">
					<el-input v-model="relationForm.remark" type="textarea" :rows="3" maxlength="200" show-word-limit />
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="relationFormVisible = false">取消</el-button>
				<el-button type="primary" :loading="relationFormLoading" @click="submitRelationForm">
					保存
				</el-button>
			</template>
		</el-dialog>
		</div>
	</permission-overlay>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-teacher-channel-teacher-list'
});

import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import { checkPerm } from '/$/base/utils/permission';
import { useDict } from '/$/dict';
import { service } from '/@/cool';
import PermissionOverlay from '../../components/permission-overlay.vue';
import { useListPage } from '../../composables/use-list-page.js';
import { performanceAccessContextService } from '../../service/access-context';
import { resolvePerformanceRoleFact } from '../../service/role-fact';
import {
	confirmElementAction,
	runTrackedElementAction
} from '../shared/action-feedback';
import {
	createElementWarningFromErrorHandler,
	resolveErrorMessage,
	showElementErrorFromError,
	showElementWarningFromError
} from '../shared/error-message';
import { loadDepartmentOptions, loadUserOptions } from '../../utils/lookup-options.js';
import {
	consumeRoutePreset,
	firstQueryValue,
	normalizeQueryNumber
} from '../../utils/route-preset.js';
import { performanceTeacherInfoService } from '../../service/teacherInfo';
import { performanceTeacherFollowService } from '../../service/teacherFollow';
import { performanceTeacherCooperationService } from '../../service/teacherCooperation';
import { performanceTeacherClassService } from '../../service/teacherClass';
import { performanceTeacherAgentService } from '../../service/teacherAgent';
import { performanceTeacherAgentRelationService } from '../../service/teacherAgentRelation';
import { performanceTeacherAttributionService } from '../../service/teacherAttribution';
import { performanceTeacherAttributionConflictService } from '../../service/teacherAttributionConflict';
import { performanceTeacherAgentAuditService } from '../../service/teacherAgentAudit';
import type {
	DepartmentOption,
	PerformanceAccessContext,
	TeacherAgentAuditRecord,
	TeacherAgentRecord,
	TeacherAgentRelationRecord,
	TeacherAttributionConflictDetail,
	TeacherAttributionConflictRecord,
	TeacherAttributionInfo,
	TeacherAttributionRecord,
	TeacherCooperationStatus,
	TeacherFollowRecord,
	TeacherInfoRecord,
	UserOption
} from '../../types';
import {
	createEmptyTeacherAgent,
	createEmptyTeacherAgentRelation,
	createEmptyTeacherAttribution,
	createEmptyTeacherFollow,
	createEmptyTeacherInfo,
	normalizeTeacherInfoDomainRecord
} from '../../types';
import {
	canCreateTeacherClass,
	canMarkTeacherCooperation,
	getTeacherInfoId,
	hasTeacherWritePermission,
	normalizeOptionalText,
	normalizeStringArray,
	resolveFollowContent,
	resolveFollowOperator,
	stringifyTagList
} from '../../utils/teacher-channel.js';

const TEACHER_COOPERATION_STATUS_DICT_KEY = 'performance.teacherChannel.cooperationStatus';

const route = useRoute();
const router = useRouter();
const { dict } = useDict();

const userOptions = ref<UserOption[]>([]);
const departmentOptions = ref<DepartmentOption[]>([]);
const followRows = ref<TeacherFollowRecord[]>([]);
const agentRows = ref<TeacherAgentRecord[]>([]);
const relationRows = ref<TeacherAgentRelationRecord[]>([]);
const conflictRows = ref<TeacherAttributionConflictRecord[]>([]);
const auditRows = ref<TeacherAgentAuditRecord[]>([]);
const attributionHistoryRows = ref<TeacherAttributionRecord[]>([]);
const accessContext = ref<PerformanceAccessContext | null>(null);
const detailLoading = ref(false);
const followLoading = ref(false);
const agentLoading = ref(false);
const relationLoading = ref(false);
const conflictLoading = ref(false);
const auditLoading = ref(false);
const attributionHistoryLoading = ref(false);
const submitLoading = ref(false);
const followSubmitLoading = ref(false);
const assignLoading = ref(false);
const agentFormLoading = ref(false);
const relationFormLoading = ref(false);
const formVisible = ref(false);
const detailVisible = ref(false);
const assignVisible = ref(false);
const agentCenterVisible = ref(false);
const conflictCenterVisible = ref(false);
const conflictDetailVisible = ref(false);
const auditCenterVisible = ref(false);
const agentFormVisible = ref(false);
const relationFormVisible = ref(false);
const pageError = ref('');
const followError = ref('');
const attributionError = ref('');
const detailActionLoading = ref<'' | 'negotiating' | 'partnered' | 'terminated'>('');
const attributionLoading = ref<'' | 'assign' | 'change' | 'remove'>('');
const conflictResolveLoading = ref<'' | 'resolved' | 'cancelled'>('');
const formRef = ref<FormInstance>();
const followFormRef = ref<FormInstance>();
const assignFormRef = ref<FormInstance>();
const editingTeacher = ref<TeacherInfoRecord | null>(null);
const detailTeacher = ref<TeacherInfoRecord | null>(null);
const agentEditingRecord = ref<TeacherAgentRecord | null>(null);
const relationEditingRecord = ref<TeacherAgentRelationRecord | null>(null);
const conflictDetail = ref<TeacherAttributionConflictDetail | null>(null);
const attributionInfo = ref<TeacherAttributionInfo | null>(null);
const assigningTeacherId = ref<number | null>(null);

const form = reactive<TeacherInfoRecord>(createEmptyTeacherInfo());
const followForm = reactive<TeacherFollowRecord>(createEmptyTeacherFollow());
const assignForm = reactive({
	ownerEmployeeId: undefined as number | undefined
});
const attributionForm = reactive({
	...createEmptyTeacherAttribution(),
	agentId: undefined as number | undefined
});
const conflictResolveForm = reactive({
	winnerAgentId: undefined as number | undefined,
	resolutionRemark: ''
});
const agentForm = reactive<TeacherAgentRecord>(createEmptyTeacherAgent());
const relationForm = reactive<TeacherAgentRelationRecord>(createEmptyTeacherAgentRelation());

const rules: FormRules = {
	teacherName: [
		{ required: true, message: '请输入班主任姓名', trigger: 'blur' },
		{ min: 1, max: 100, message: '班主任姓名长度需在 1-100 之间', trigger: 'blur' }
	],
	schoolName: [
		{ required: true, message: '请输入学校名称', trigger: 'blur' },
		{ min: 1, max: 100, message: '学校名称长度需在 1-100 之间', trigger: 'blur' }
	]
};

const followRules: FormRules = {
	content: [
		{ required: true, message: '请输入跟进内容', trigger: 'blur' },
		{ min: 1, max: 500, message: '跟进内容长度需在 1-500 之间', trigger: 'blur' }
	]
};

const assignRules: FormRules = {
	ownerEmployeeId: [{ required: true, message: '请选择负责人', trigger: 'change' }]
};

const canAccess = computed(() => checkPerm(performanceTeacherInfoService.permission.page));
const showInfoButton = computed(() => checkPerm(performanceTeacherInfoService.permission.info));
const showAddButton = computed(() => checkPerm(performanceTeacherInfoService.permission.add));
const showUpdateButton = computed(() => checkPerm(performanceTeacherInfoService.permission.update));
const showAssignButton = computed(() => checkPerm(performanceTeacherInfoService.permission.assign));
const showUpdateStatusButton = computed(() =>
	checkPerm(performanceTeacherInfoService.permission.updateStatus)
);
const showFollowPageButton = computed(() =>
	checkPerm(performanceTeacherFollowService.permission.page)
);
const showFollowAddButton = computed(() =>
	checkPerm(performanceTeacherFollowService.permission.add)
);
const showCooperationMarkButton = computed(() =>
	checkPerm(performanceTeacherCooperationService.permission.mark)
);
const showClassAddButton = computed(() => checkPerm(performanceTeacherClassService.permission.add));
const showAgentPageButton = computed(
	() =>
		checkPerm(performanceTeacherAgentService.permission.page) ||
		checkPerm(performanceTeacherAgentRelationService.permission.page)
);
const showConflictPageButton = computed(() =>
	checkPerm(performanceTeacherAttributionConflictService.permission.page)
);
const showAuditPageButton = computed(() =>
	checkPerm(performanceTeacherAgentAuditService.permission.page)
);
const showAgentAddButton = computed(() => checkPerm(performanceTeacherAgentService.permission.add));
const showAgentUpdateButton = computed(() =>
	checkPerm(performanceTeacherAgentService.permission.update)
);
const showAgentUpdateStatusButton = computed(() =>
	checkPerm(performanceTeacherAgentService.permission.updateStatus)
);
const showAgentBlacklistButton = computed(
	() =>
		checkPerm(performanceTeacherAgentService.permission.blacklist) ||
		checkPerm(performanceTeacherAgentService.permission.unblacklist)
);
const showAgentRelationAddButton = computed(() =>
	checkPerm(performanceTeacherAgentRelationService.permission.add)
);
const showAgentRelationUpdateButton = computed(() =>
	checkPerm(performanceTeacherAgentRelationService.permission.update)
);
const showAgentRelationDeleteButton = computed(() =>
	checkPerm(performanceTeacherAgentRelationService.permission.delete)
);
const canViewAttributionInfo = computed(() =>
	checkPerm(performanceTeacherInfoService.permission.attributionInfo)
);
const canViewAttributionHistory = computed(() =>
	checkPerm(performanceTeacherInfoService.permission.attributionHistory)
);
const showAttributionInfoButton = computed(() =>
	canViewAttributionInfo.value && canViewAttributionHistory.value
);
const showAttributionWriteActions = computed(
	() =>
		checkPerm(performanceTeacherAttributionService.permission.assign) ||
		checkPerm(performanceTeacherAttributionService.permission.change) ||
		checkPerm(performanceTeacherAttributionService.permission.remove)
);
const showConflictResolveButton = computed(() =>
	checkPerm(performanceTeacherAttributionConflictService.permission.resolve)
);
const isReadOnlyRole = computed(
	() =>
		!hasTeacherWritePermission({
			teacherAdd: showAddButton.value,
			teacherUpdate: showUpdateButton.value,
			teacherAssign: showAssignButton.value,
			teacherUpdateStatus: showUpdateStatusButton.value,
			followAdd: showFollowAddButton.value,
			cooperationMark: showCooperationMarkButton.value,
			classAdd: showClassAddButton.value,
			classUpdate: checkPerm(performanceTeacherClassService.permission.update),
			classDelete: checkPerm(performanceTeacherClassService.permission.delete)
		})
);
const roleFact = computed(() =>
	resolvePerformanceRoleFact({
		personaKey: accessContext.value?.activePersonaKey || null,
		roleKind: accessContext.value?.roleKind || null
	})
);
const teacherCapabilityLabel = computed(() =>
	isReadOnlyRole.value ? '只读能力' : '可写能力'
);
const teacherCapabilityTagType = computed(() =>
	isReadOnlyRole.value ? 'info' : 'success'
);
const teacherList = useListPage({
	createFilters: () => ({
		keyword: '',
		cooperationStatus: '' as TeacherCooperationStatus | '',
		ownerDepartmentId: undefined as number | undefined
	}),
	canLoad: () => canAccess.value,
	fetchPage: async params => {
		const result = await performanceTeacherInfoService.fetchPage({
			page: params.page,
			size: params.size,
			keyword: params.keyword || undefined,
			cooperationStatus: params.cooperationStatus || undefined,
			ownerDepartmentId: params.ownerDepartmentId || undefined
		});

		return {
			...result,
			list: (result.list || []).map(normalizeTeacherInfoDomainRecord)
		};
	},
	onError: (error: unknown) => {
		pageError.value = resolveErrorMessage(error, '班主任资源列表加载失败');
		ElMessage.error(pageError.value);
	}
});
const rows = teacherList.rows;
const tableLoading = teacherList.loading;
const filters = teacherList.filters;
const pagination = teacherList.pager;

const filterDepartmentIdModel = computed<number | undefined>({
	get: () => filters.ownerDepartmentId ?? undefined,
	set: value => {
		filters.ownerDepartmentId = value;
	}
});

const attributionAgentOptions = computed(() =>
	agentRows.value.filter(
		item => item.status === 'active' && item.blacklistStatus !== 'blacklisted'
	)
);
const relationAgentOptions = computed(() =>
	agentRows.value.filter(item => item.status === 'active')
);

const assignOwnerModel = computed<number | undefined>({
	get: () => assignForm.ownerEmployeeId ?? undefined,
	set: value => {
		assignForm.ownerEmployeeId = value;
	}
});

const attributionAgentModel = computed<number | undefined>({
	get: () => attributionForm.agentId ?? undefined,
	set: value => {
		attributionForm.agentId = value;
	}
});

const conflictResolveAgentModel = computed<number | undefined>({
	get: () => conflictResolveForm.winnerAgentId ?? undefined,
	set: value => {
		conflictResolveForm.winnerAgentId = value;
	}
});

const relationParentAgentModel = computed<number | undefined>({
	get: () => relationForm.parentAgentId ?? undefined,
	set: value => {
		relationForm.parentAgentId = value;
	}
});

const relationChildAgentModel = computed<number | undefined>({
	get: () => relationForm.childAgentId ?? undefined,
	set: value => {
		relationForm.childAgentId = value;
	}
});

const relationEffectiveTimeModel = computed<string | undefined>({
	get: () => String(relationForm.effectiveTime || '') || undefined,
	set: value => {
		relationForm.effectiveTime = value ?? undefined;
	}
});

const projectTagsText = computed({
	get: () => normalizeStringArray(form.projectTags).join(', '),
	set: value => {
		form.projectTags = normalizeStringArray(value);
	}
});
const formNextFollowTimeModel = computed<string | undefined>({
	get: () => String(form.nextFollowTime || '') || undefined,
	set: value => {
		form.nextFollowTime = value ?? undefined;
	}
});
const followNextFollowTimeModel = computed<string | undefined>({
	get: () => String(followForm.nextFollowTime || '') || undefined,
	set: value => {
		followForm.nextFollowTime = value ?? undefined;
	}
});

const cooperationStatusOptions = computed<
	Array<{ label: string; value: TeacherCooperationStatus }>
>(() =>
	dict.get(TEACHER_COOPERATION_STATUS_DICT_KEY).value.map(item => ({
		label: item.label,
		value: item.value as TeacherCooperationStatus
	}))
);

const detailAlertMessage = computed(() => {
	if (isReadOnlyRole.value) {
		return '当前账号无主题19写权限，详情、联系方式和跟进时间线仅作只读展示。';
	}

	if (detailTeacher.value?.cooperationStatus === 'terminated') {
		return '当前班主任已终止合作，不允许继续新建班级。';
	}

	return '未至少跟进一次前不可标记合作；首次跟进后由后端推进为 contacted。';
});

onMounted(async () => {
	await Promise.all([
		dict.refresh([TEACHER_COOPERATION_STATUS_DICT_KEY]),
		loadAccessContext()
	]);
	await loadUsers();
	await loadDepartments();
	await refresh();
	await consumeTeacherRoutePreset();
});

async function loadAccessContext() {
	try {
		accessContext.value = await performanceAccessContextService.fetchContext();
	} catch (error: unknown) {
		accessContext.value = null;
		showElementWarningFromError(error, '角色上下文加载失败，已使用兼容展示视角');
	}
}

watch(
	() => route.query,
	async () => {
		await consumeTeacherRoutePreset();
	},
	{ deep: true }
);

async function loadUsers() {
	userOptions.value = await loadUserOptions(
		() =>
			service.base.sys.user.page({
				page: 1,
				size: 200
			}),
		createElementWarningFromErrorHandler('负责人选项加载失败')
	);
}

async function loadDepartments() {
	departmentOptions.value = await loadDepartmentOptions(
		() => service.base.sys.department.list(),
		createElementWarningFromErrorHandler('部门选项加载失败')
	);
}

async function refresh() {
	pageError.value = '';
	await teacherList.reload();
}

function handleSearch() {
	void teacherList.search();
}

function handleReset() {
	void teacherList.reset({
		ownerDepartmentId: undefined
	});
}

function changePage(page: number) {
	void teacherList.goToPage(page);
}

function openCreate() {
	editingTeacher.value = null;
	Object.assign(form, createEmptyTeacherInfo());
	formVisible.value = true;
	nextTick(() => {
		formRef.value?.clearValidate();
	});
}

async function openEdit(row: TeacherInfoRecord) {
	if (!canEdit(row)) {
		return;
	}

	const id = getTeacherInfoId(row);

	if (!id) {
		return;
	}

	try {
		const detail = normalizeTeacherInfoDomainRecord(
			await performanceTeacherInfoService.fetchInfo({ id })
		);
		editingTeacher.value = detail;
		Object.assign(form, createEmptyTeacherInfo(), detail);
		formVisible.value = true;
		nextTick(() => {
			formRef.value?.clearValidate();
		});
	} catch (error: unknown) {
		showElementErrorFromError(error, '班主任详情加载失败');
	}
}

async function submitForm() {
	await formRef.value?.validate();
	submitLoading.value = true;

	try {
		const payload: Partial<TeacherInfoRecord> = {
			id: editingTeacher.value?.id,
			teacherName: form.teacherName.trim(),
			schoolName: normalizeOptionalText(form.schoolName),
			phone: normalizeOptionalText(form.phone as string | undefined),
			wechat: normalizeOptionalText(form.wechat as string | undefined),
			schoolRegion: normalizeOptionalText(form.schoolRegion as string | undefined),
			schoolType: normalizeOptionalText(form.schoolType as string | undefined),
			grade: normalizeOptionalText(form.grade as string | undefined),
			className: normalizeOptionalText(form.className as string | undefined),
			subject: normalizeOptionalText(form.subject as string | undefined),
			projectTags: normalizeStringArray(form.projectTags),
			intentionLevel: normalizeOptionalText(form.intentionLevel as string | undefined),
			communicationStyle: normalizeOptionalText(
				form.communicationStyle as string | undefined
			),
			nextFollowTime: normalizeOptionalText(form.nextFollowTime as string | undefined)
		};

		if (editingTeacher.value?.id) {
			await performanceTeacherInfoService.updateTeacherInfo(
				payload as Partial<TeacherInfoRecord> & { id: number }
			);
		} else {
			await performanceTeacherInfoService.createTeacherInfo(payload);
		}

		ElMessage.success('保存成功');
		formVisible.value = false;
		await refresh();
	} catch (error: unknown) {
		showElementErrorFromError(error, '班主任资源保存失败');
	} finally {
		submitLoading.value = false;
	}
}

async function openDetailFromRow(
	row: TeacherInfoRecord,
	options: {
		focusFollow?: boolean;
	} = {}
) {
	const id = getTeacherInfoId(row);

	if (!id) {
		return;
	}

	await openDetailById(id, options);
}

async function openDetailById(
	id: number,
	options: {
		focusFollow?: boolean;
	} = {}
) {
	detailVisible.value = true;
	detailLoading.value = true;
	followError.value = '';

	try {
		const [detail, followResult] = await Promise.all([
			performanceTeacherInfoService.fetchInfo({ id }),
			loadFollowList(id),
			loadAttributionDetail(id),
			loadAgentRows()
		]);

		detailTeacher.value = normalizeTeacherInfoDomainRecord(detail);
		followRows.value = followResult;

		if (options.focusFollow && showFollowAddButton.value) {
			Object.assign(followForm, createEmptyTeacherFollow(), {
				teacherId: id
			});
			nextTick(() => {
				followFormRef.value?.clearValidate();
			});
		}
	} catch (error: unknown) {
		showElementErrorFromError(error, '班主任详情加载失败');
	} finally {
		detailLoading.value = false;
	}
}

async function loadFollowList(teacherId: number) {
	if (!showFollowPageButton.value) {
		return [];
	}

	followLoading.value = true;
	followError.value = '';

	try {
		const result = await performanceTeacherFollowService.fetchPage({
			page: 1,
			size: 20,
			teacherId
		});

		return result.list || [];
	} catch (error: unknown) {
		followError.value = resolveErrorMessage(error, '跟进记录加载失败');
		return [];
	} finally {
		followLoading.value = false;
	}
}

async function submitFollow() {
	if (!detailTeacher.value?.id) {
		return;
	}

	await followFormRef.value?.validate();
	followSubmitLoading.value = true;

	try {
		await performanceTeacherFollowService.createTeacherFollow({
			teacherId: detailTeacher.value.id,
			followContent: normalizeOptionalText(followForm.content),
			nextFollowTime: normalizeOptionalText(followForm.nextFollowTime as string | undefined)
		});
		ElMessage.success('跟进已新增');
		Object.assign(followForm, createEmptyTeacherFollow(), {
			teacherId: detailTeacher.value.id
		});
		await openDetailById(detailTeacher.value.id, {
			focusFollow: true
		});
		await refresh();
	} catch (error: unknown) {
		showElementErrorFromError(error, '跟进新增失败');
	} finally {
		followSubmitLoading.value = false;
	}
}

function openAssign(row: TeacherInfoRecord) {
	if (!canAssign(row)) {
		return;
	}

	assigningTeacherId.value = getTeacherInfoId(row) || null;
	assignForm.ownerEmployeeId = Number(row.ownerEmployeeId || 0) || undefined;
	assignVisible.value = true;
	nextTick(() => {
		assignFormRef.value?.clearValidate();
	});
}

async function submitAssign() {
	if (!assigningTeacherId.value) {
		return;
	}

	await assignFormRef.value?.validate();
	assignLoading.value = true;

	try {
		await performanceTeacherInfoService.assign({
			id: assigningTeacherId.value,
			ownerEmployeeId: Number(assignForm.ownerEmployeeId)
		});
		ElMessage.success('负责人分配成功');
		assignVisible.value = false;
		await refresh();
		if (detailTeacher.value?.id === assigningTeacherId.value) {
			await openDetailById(assigningTeacherId.value);
		}
	} catch (error: unknown) {
		showElementErrorFromError(error, '负责人分配失败');
	} finally {
		assignLoading.value = false;
	}
}

async function handleMarkCooperation(row: TeacherInfoRecord) {
	const id = getTeacherInfoId(row);

	if (!id || !canMark(row)) {
		ElMessage.warning('当前资源未满足合作标记条件');
		return;
	}

	const confirmed = await confirmElementAction(
		`确认将班主任「${row.teacherName}」标记为已合作吗？`,
		'合作确认'
	);

	if (!confirmed) {
		return;
	}

	await runTrackedElementAction({
		rowId: id,
		actionType: 'partnered',
		request: () => performanceTeacherCooperationService.mark({ id }),
		successMessage: '已标记为合作',
		errorMessage: '合作标记失败',
		setLoading: rowId => {
			detailActionLoading.value = rowId ? 'partnered' : '';
		},
		onSuccess: async () => {
			if (detailTeacher.value?.id === id) {
				await openDetailById(id);
			}
		},
		refresh
	});
}

async function handleUpdateStatus(
	row: TeacherInfoRecord,
	cooperationStatus: TeacherCooperationStatus
) {
	const id = getTeacherInfoId(row);

	if (!id) {
		return;
	}

	const actionLabel =
		cooperationStatus === 'negotiating'
			? '推进为洽谈中'
			: cooperationStatusLabel(cooperationStatus);

	const confirmed = await confirmElementAction(
		`确认将班主任「${row.teacherName}」${actionLabel}吗？`,
		'状态确认'
	);

	if (!confirmed) {
		return;
	}

	await runTrackedElementAction({
		rowId: id,
		actionType: cooperationStatus === 'negotiating' ? 'negotiating' : 'terminated',
		request: () =>
			performanceTeacherInfoService.updateStatus({
				id,
				status: cooperationStatus
			}),
		successMessage: '状态更新成功',
		errorMessage: '状态更新失败',
		setLoading: rowId => {
			detailActionLoading.value = rowId
				? cooperationStatus === 'negotiating'
					? 'negotiating'
					: 'terminated'
				: '';
		},
		onSuccess: async () => {
			if (detailTeacher.value?.id === id) {
				await openDetailById(id);
			}
		},
		refresh
	});
}

function canEdit(row: TeacherInfoRecord) {
	return showUpdateButton.value && row.cooperationStatus !== 'terminated';
}

function canAssign(_row: TeacherInfoRecord) {
	return showAssignButton.value;
}

function showFollowEntry(_row: TeacherInfoRecord) {
	return showFollowPageButton.value;
}

function canMark(row: TeacherInfoRecord) {
	return canMarkTeacherCooperation(row, showCooperationMarkButton.value);
}

function canCreateClass(row: TeacherInfoRecord) {
	return canCreateTeacherClass(row, showClassAddButton.value);
}

function canAdvanceNegotiating(row: TeacherInfoRecord) {
	return showUpdateStatusButton.value && row.cooperationStatus === 'contacted';
}

function canTerminate(row: TeacherInfoRecord) {
	return (
		showUpdateStatusButton.value &&
		showAssignButton.value &&
		row.cooperationStatus === 'partnered'
	);
}

function cooperationStatusLabel(value?: TeacherCooperationStatus | '') {
	return dict.getLabel(TEACHER_COOPERATION_STATUS_DICT_KEY, value) || value || '-';
}

function cooperationStatusTagType(value?: TeacherCooperationStatus | '') {
	return dict.getMeta(TEACHER_COOPERATION_STATUS_DICT_KEY, value)?.tone || 'info';
}

function goCreateClass(row: TeacherInfoRecord) {
	const teacherId = getTeacherInfoId(row);

	if (!teacherId) {
		return;
	}

	router.push({
		path: '/performance/teacher-channel/class',
		query: {
			openCreate: '1',
			teacherId: String(teacherId)
		}
	});
}

async function consumeTeacherRoutePreset() {
	await consumeRoutePreset({
		route,
		router,
		keys: ['teacherId', 'openDetail', 'openFollow'],
		parse: query => ({
			teacherId: normalizeQueryNumber(query.teacherId),
			openDetail: firstQueryValue(query.openDetail) === '1',
			openFollow: firstQueryValue(query.openFollow) === '1'
		}),
		shouldConsume: payload =>
			Boolean(payload.teacherId && (payload.openDetail || payload.openFollow)),
		consume: async payload => {
			await openDetailById(payload.teacherId as number, {
				focusFollow: payload.openFollow
			});
		}
	});
}

async function loadAgentRows() {
	if (!checkPerm(performanceTeacherAgentService.permission.page)) {
		agentRows.value = [];
		return [];
	}

	agentLoading.value = true;

	try {
		const result = await performanceTeacherAgentService.fetchPage({
			page: 1,
			size: 200
		});
		agentRows.value = result.list || [];
		return agentRows.value;
	} catch (error: unknown) {
		showElementErrorFromError(error, '代理主体列表加载失败');
		return [];
	} finally {
		agentLoading.value = false;
	}
}

async function loadRelationRows() {
	if (!checkPerm(performanceTeacherAgentRelationService.permission.page)) {
		relationRows.value = [];
		return [];
	}

	relationLoading.value = true;

	try {
		const result = await performanceTeacherAgentRelationService.fetchPage({
			page: 1,
			size: 200
		});
		relationRows.value = result.list || [];
		return relationRows.value;
	} catch (error: unknown) {
		showElementErrorFromError(error, '代理关系列表加载失败');
		return [];
	} finally {
		relationLoading.value = false;
	}
}

async function openAgentCenter() {
	agentCenterVisible.value = true;
	await Promise.all([loadAgentRows(), loadRelationRows()]);
}

function openAgentForm(row?: TeacherAgentRecord) {
	agentEditingRecord.value = row || null;
	Object.assign(agentForm, createEmptyTeacherAgent(), row || {});
	agentFormVisible.value = true;
}

async function submitAgentForm() {
	if (!normalizeOptionalText(agentForm.name)) {
		ElMessage.warning('请输入代理主体名称');
		return;
	}

	if (!normalizeOptionalText(agentForm.agentType)) {
		ElMessage.warning('请选择代理主体类型');
		return;
	}

	agentFormLoading.value = true;

	try {
		const payload = {
			id: agentEditingRecord.value?.id,
			name: normalizeOptionalText(agentForm.name),
			agentType: normalizeOptionalText(agentForm.agentType),
			level: normalizeOptionalText(agentForm.level as string | undefined),
			region: normalizeOptionalText(agentForm.region as string | undefined),
			cooperationStatus: normalizeOptionalText(
				agentForm.cooperationStatus as string | undefined
			),
			remark: normalizeOptionalText(agentForm.remark as string | undefined)
		};

		if (agentEditingRecord.value?.id) {
			await performanceTeacherAgentService.updateTeacherAgent(
				payload as Partial<TeacherAgentRecord> & { id: number }
			);
		} else {
			await performanceTeacherAgentService.createTeacherAgent(payload);
		}

		ElMessage.success('代理主体保存成功');
		agentFormVisible.value = false;
		await loadAgentRows();
	} catch (error: unknown) {
		showElementErrorFromError(error, '代理主体保存失败');
	} finally {
		agentFormLoading.value = false;
	}
}

async function toggleAgentStatus(row: TeacherAgentRecord) {
	if (!row.id) {
		return;
	}

	const rowId = row.id;
	const targetStatus = row.status === 'active' ? 'inactive' : 'active';

	const confirmed = await confirmElementAction(
		`确认将代理主体「${row.name}」切换为 ${targetStatus} 吗？`,
		'状态确认'
	);

	if (!confirmed) {
		return;
	}

	await runTrackedElementAction({
		rowId,
		actionType: 'toggleAgentStatus',
		request: () =>
			performanceTeacherAgentService.updateStatus({
				id: rowId,
				status: targetStatus
			}),
		successMessage: '代理主体状态已更新',
		errorMessage: '代理主体状态更新失败',
		refresh: async () => {
			await loadAgentRows();
		}
	});
}

async function toggleAgentBlacklist(row: TeacherAgentRecord, shouldBlacklist: boolean) {
	if (!row.id) {
		return;
	}

	const rowId = row.id;
	const confirmed = await confirmElementAction(
		shouldBlacklist
			? `确认将代理主体「${row.name}」加入黑名单吗？`
			: `确认将代理主体「${row.name}」移出黑名单吗？`,
		'黑名单确认'
	);

	if (!confirmed) {
		return;
	}

	await runTrackedElementAction({
		rowId,
		actionType: shouldBlacklist ? 'blacklistAgent' : 'unblacklistAgent',
		request: () =>
			shouldBlacklist
				? performanceTeacherAgentService.blacklist({ id: rowId })
				: performanceTeacherAgentService.unblacklist({ id: rowId }),
		successMessage: shouldBlacklist ? '已拉黑代理主体' : '已解除黑名单',
		errorMessage: '代理主体黑名单状态更新失败',
		refresh: async () => {
			await loadAgentRows();
		}
	});
}

async function openRelationForm(row?: TeacherAgentRelationRecord) {
	await loadAgentRows();
	relationEditingRecord.value = row || null;
	Object.assign(relationForm, createEmptyTeacherAgentRelation(), row || {});
	relationFormVisible.value = true;
}

async function submitRelationForm() {
	if (!relationForm.parentAgentId || !relationForm.childAgentId) {
		ElMessage.warning('请选择父级代理和子级代理');
		return;
	}

	if (relationForm.parentAgentId === relationForm.childAgentId) {
		ElMessage.warning('代理关系不允许指向自身');
		return;
	}

	relationFormLoading.value = true;

	try {
		const payload = {
			id: relationEditingRecord.value?.id,
			parentAgentId: relationForm.parentAgentId,
			childAgentId: relationForm.childAgentId,
			effectiveTime: normalizeOptionalText(
				relationForm.effectiveTime as string | undefined
			),
			remark: normalizeOptionalText(relationForm.remark as string | undefined)
		};

		if (relationEditingRecord.value?.id) {
			await performanceTeacherAgentRelationService.updateTeacherAgentRelation(
				payload as Partial<TeacherAgentRelationRecord> & { id: number }
			);
		} else {
			await performanceTeacherAgentRelationService.createTeacherAgentRelation(payload);
		}

		ElMessage.success('代理关系保存成功');
		relationFormVisible.value = false;
		await loadRelationRows();
	} catch (error: unknown) {
		showElementErrorFromError(error, '代理关系保存失败');
	} finally {
		relationFormLoading.value = false;
	}
}

async function removeRelation(row: TeacherAgentRelationRecord) {
	if (!row.id) {
		return;
	}

	const rowId = row.id;
	const confirmed = await confirmElementAction(
		`确认将代理关系「${row.parentAgentName || '-'} -> ${row.childAgentName || '-'}」置为失效吗？`,
		'关系失效确认'
	);

	if (!confirmed) {
		return;
	}

	await runTrackedElementAction({
		rowId,
		actionType: 'removeRelation',
		request: () =>
			performanceTeacherAgentRelationService.removeTeacherAgentRelation({
				id: rowId
			}),
		successMessage: '代理关系已失效',
		errorMessage: '代理关系失效失败',
		refresh: async () => {
			await loadRelationRows();
		}
	});
}

async function loadConflicts() {
	if (!showConflictPageButton.value) {
		conflictRows.value = [];
		return [];
	}

	conflictLoading.value = true;

	try {
		const result = await performanceTeacherAttributionConflictService.fetchPage({
			page: 1,
			size: 100
		});
		conflictRows.value = result.list || [];
		return conflictRows.value;
	} catch (error: unknown) {
		showElementErrorFromError(error, '归因冲突列表加载失败');
		return [];
	} finally {
		conflictLoading.value = false;
	}
}

async function openConflictCenter() {
	conflictCenterVisible.value = true;
	await Promise.all([loadAgentRows(), loadConflicts()]);
}

async function openConflictDetail(row: TeacherAttributionConflictRecord) {
	if (!row.id) {
		return;
	}

	conflictDetailVisible.value = true;

	try {
		const detail = await performanceTeacherAttributionConflictService.fetchInfo({
			id: row.id
		});
		conflictDetail.value = detail;
		Object.assign(conflictResolveForm, {
			winnerAgentId: detail.currentAgentId || detail.requestedAgentId || undefined,
			resolutionRemark: detail.resolutionRemark || ''
		});
		await loadAgentRows();
	} catch (error: unknown) {
		showElementErrorFromError(error, '归因冲突详情加载失败');
	}
}

async function submitConflictResolve(resolution: 'resolved' | 'cancelled') {
	if (!conflictDetail.value?.id) {
		return;
	}

	conflictResolveLoading.value = resolution;

	try {
		await performanceTeacherAttributionConflictService.resolveConflict({
			id: conflictDetail.value.id,
			resolution,
			agentId:
				resolution === 'resolved'
					? conflictResolveForm.winnerAgentId ?? null
					: undefined,
			resolutionRemark: normalizeOptionalText(conflictResolveForm.resolutionRemark)
		});
		ElMessage.success('归因冲突处理完成');
		conflictDetailVisible.value = false;
		await loadConflicts();
		const currentTeacherId = detailTeacher.value?.id;
		if (currentTeacherId && currentTeacherId === conflictDetail.value.teacherId) {
			await loadAttributionDetail(currentTeacherId);
		}
	} catch (error: unknown) {
		showElementErrorFromError(error, '归因冲突处理失败');
	} finally {
		conflictResolveLoading.value = '';
	}
}

async function loadAuditRows() {
	if (!showAuditPageButton.value) {
		auditRows.value = [];
		return [];
	}

	auditLoading.value = true;

	try {
		const result = await performanceTeacherAgentAuditService.fetchPage({
			page: 1,
			size: 100
		});
		auditRows.value = result.list || [];
		return auditRows.value;
	} catch (error: unknown) {
		showElementErrorFromError(error, '代理体系审计加载失败');
		return [];
	} finally {
		auditLoading.value = false;
	}
}

async function openAuditCenter() {
	auditCenterVisible.value = true;
	await loadAuditRows();
}

async function loadAttributionDetail(teacherId: number) {
	attributionError.value = '';
	attributionHistoryLoading.value = true;

	if (!showAttributionInfoButton.value) {
		attributionInfo.value = null;
		attributionHistoryRows.value = [];
		Object.assign(attributionForm, createEmptyTeacherAttribution(), {
			teacherId,
			agentId: undefined,
			sourceRemark: ''
		});
		attributionHistoryLoading.value = false;
		return null;
	}

	try {
		const [info, history] = await Promise.all([
			performanceTeacherInfoService.fetchAttributionInfo({ id: teacherId }),
			performanceTeacherInfoService.fetchAttributionHistory({ id: teacherId })
		]);
		attributionInfo.value = info;
		attributionHistoryRows.value = history || [];
		Object.assign(attributionForm, createEmptyTeacherAttribution(), {
			teacherId,
			agentId: info.currentAttribution?.agentId ?? undefined,
			sourceRemark: ''
		});
		return info;
	} catch (error: unknown) {
		attributionInfo.value = null;
		attributionHistoryRows.value = [];
		attributionError.value = resolveErrorMessage(error, '班主任归因信息加载失败');
		return null;
	} finally {
		attributionHistoryLoading.value = false;
	}
}

async function submitAttribution(action: 'assign' | 'change' | 'remove') {
	if (!detailTeacher.value?.id) {
		return;
	}

	attributionLoading.value = action;

	try {
		if (action === 'remove') {
			await performanceTeacherAttributionService.remove({
				teacherId: detailTeacher.value.id
			});
		} else {
			const payload = {
				teacherId: detailTeacher.value.id,
				agentId: attributionForm.agentId ?? null,
				sourceRemark: normalizeOptionalText(
					attributionForm.sourceRemark as string | undefined
				)
			};

			if (action === 'assign') {
				await performanceTeacherAttributionService.assign(payload);
			} else {
				await performanceTeacherAttributionService.change(payload);
			}
		}

		ElMessage.success('归因操作已提交');
		await Promise.all([
			loadAttributionDetail(detailTeacher.value.id),
			refresh(),
			conflictCenterVisible.value ? loadConflicts() : Promise.resolve([])
		]);
	} catch (error: unknown) {
		showElementErrorFromError(error, '归因操作失败');
	} finally {
		attributionLoading.value = '';
	}
}

</script>

<style lang="scss" scoped>
@use '../../../../styles/patterns.teacher-channel.scss' as teacherChannel;

.teacher-channel-teacher-page {
	@include teacherChannel.teacher-channel-workspace-shell(1320px);
}
</style>
