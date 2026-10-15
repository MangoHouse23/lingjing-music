import { ref } from 'vue';

/** 演示模式标记（后端不可达时自动开启，本地曲库接管全部请求） */
export const demoMode = ref(false);

export function setDemoMode() {
  if (!demoMode.value) {
    demoMode.value = true;
    console.info('[聆境] 未检测到后端服务，已切换到静态演示模式');
  }
}
