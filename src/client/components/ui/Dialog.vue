<script setup lang="ts">
import {
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import { X } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  open?: boolean | null
  contentClass?: string
  showCloseButton?: boolean
}>(), {
  open: null,
  showCloseButton: true,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()
</script>

<template>
  <DialogRoot v-bind="open !== null ? { open } : {}" @update:open="emit('update:open', $event)">
    <slot name="trigger">
      <DialogTrigger as-child>
        <slot name="trigger-content" />
      </DialogTrigger>
    </slot>

    <DialogPortal>
      <DialogOverlay
        class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50"
      />
      <DialogContent
        :class="cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 outline-none sm:max-w-lg',
          contentClass
        )"
        @open-auto-focus.prevent
      >
        <slot />
        <DialogClose
          v-if="showCloseButton"
          class="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer"
        >
          <X />
          <span class="sr-only">Close</span>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
