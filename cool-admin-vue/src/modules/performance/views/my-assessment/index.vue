<template>
	<assessment-page class="my-assessment-page" title="我的考核" mode="my" />
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-my-assessment'
});

import AssessmentPage from '../../components/assessment-page.vue';
</script>
