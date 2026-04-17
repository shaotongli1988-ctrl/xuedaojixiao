<template>
	<assessment-page title="待我审批" mode="pending" />
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-pending'
});

import AssessmentPage from '../../components/assessment-page.vue';
</script>
