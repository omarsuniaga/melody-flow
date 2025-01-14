<template>
  <div class="min-h-screen p-2 sm:p-4 bg-gray-50">
    <div class="max-w-2xl mx-auto">
      <div class="bg-white rounded-lg shadow p-3 sm:p-6">
        <div class="text-center">
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            <UserPlusIcon class="h-8 w-8 mx-auto mb-2 text-blue-600" />
            {{ t("register.title") }}
          </h2>
        </div>

        <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form class="space-y-6" @submit.prevent="handleRegister">
              <!-- Full Name -->
              <div>
                <label for="fullName" class="label">{{ t("register.fullName") }}</label>
                <input
                  id="fullName"
                  type="text"
                  v-model="form.fullName"
                  required
                  pattern="[A-Za-z ]{2,50}"
                  :placeholder="t('register.fullNamePlaceholder')"
                  class="input"
                  :aria-invalid="errors.fullName ? 'true' : 'false'"
                  :aria-describedby="errors.fullName ? 'fullName-error' : undefined"
                />
                <p
                  v-if="errors.fullName"
                  id="fullName-error"
                  class="mt-2 text-sm text-red-600"
                >
                  {{ errors.fullName }}
                </p>
              </div>

              <!-- Email -->
              <div>
                <label for="email" class="label">{{ t("register.email") }}</label>
                <input
                  id="email"
                  type="email"
                  v-model="form.email"
                  required
                  :placeholder="t('register.emailPlaceholder')"
                  class="input"
                  :aria-invalid="errors.email ? 'true' : 'false'"
                  :aria-describedby="errors.email ? 'email-error' : undefined"
                />
                <p v-if="errors.email" id="email-error" class="mt-2 text-sm text-red-600">
                  {{ errors.email }}
                </p>
              </div>

              <!-- Password -->
              <div>
                <label for="password" class="label">{{ t("register.password") }}</label>
                <div class="relative">
                  <input
                    :type="showPassword ? 'text' : 'password'"
                    id="password"
                    v-model="form.password"
                    required
                    :placeholder="t('register.passwordPlaceholder')"
                    class="input pr-10"
                    :aria-invalid="errors.password ? 'true' : 'false'"
                    :aria-describedby="
                      errors.password
                        ? 'password-error password-strength'
                        : 'password-strength'
                    "
                  />
                  <button
                    type="button"
                    @click="showPassword = !showPassword"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <EyeIcon v-if="!showPassword" class="h-5 w-5 text-gray-400" />
                    <EyeSlashIcon v-else class="h-5 w-5 text-gray-400" />
                  </button>
                </div>

                <!-- Password Strength Meter -->
                <div id="password-strength" class="mt-2">
                  <div class="flex items-center space-x-2">
                    <div class="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        class="h-full transition-all duration-300"
                        :class="passwordStrengthClass"
                        :style="{ width: `${passwordStrength.score * 25}%` }"
                      ></div>
                    </div>
                    <span class="text-sm" :class="passwordStrengthTextClass">
                      {{ passwordStrength.label }}
                    </span>
                  </div>
                  <ul class="mt-2 space-y-1 text-sm text-gray-500">
                    <li :class="{ 'text-green-600': passwordStrength.hasMinLength }">
                      {{ t("register.passwordRequirements.length") }}
                    </li>
                    <li :class="{ 'text-green-600': passwordStrength.hasUppercase }">
                      {{ t("register.passwordRequirements.uppercase") }}
                    </li>
                    <li :class="{ 'text-green-600': passwordStrength.hasLowercase }">
                      {{ t("register.passwordRequirements.lowercase") }}
                    </li>
                    <li :class="{ 'text-green-600': passwordStrength.hasNumber }">
                      {{ t("register.passwordRequirements.number") }}
                    </li>
                    <li :class="{ 'text-green-600': passwordStrength.hasSpecial }">
                      {{ t("register.passwordRequirements.special") }}
                    </li>
                  </ul>
                </div>

                <p
                  v-if="errors.password"
                  id="password-error"
                  class="mt-2 text-sm text-red-600"
                >
                  {{ errors.password }}
                </p>
              </div>

              <!-- Confirm Password -->
              <div>
                <label for="confirmPassword" class="label">{{
                  t("register.confirmPassword")
                }}</label>
                <input
                  type="password"
                  id="confirmPassword"
                  v-model="form.confirmPassword"
                  required
                  :placeholder="t('register.confirmPasswordPlaceholder')"
                  class="input"
                  :aria-invalid="errors.confirmPassword ? 'true' : 'false'"
                  :aria-describedby="
                    errors.confirmPassword ? 'confirmPassword-error' : undefined
                  "
                />
                <p
                  v-if="errors.confirmPassword"
                  id="confirmPassword-error"
                  class="mt-2 text-sm text-red-600"
                >
                  {{ errors.confirmPassword }}
                </p>
              </div>

              <!-- Consent Checkboxes -->
              <div class="space-y-4">
                <div class="flex items-start">
                  <div class="flex items-center h-5">
                    <input
                      id="terms"
                      type="checkbox"
                      v-model="form.acceptTerms"
                      required
                      class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div class="ml-3 text-sm">
                    <label for="terms" class="font-medium text-gray-700">
                      {{ t("register.acceptTerms") }}
                    </label>
                    <p class="text-gray-500">
                      <a href="#" class="text-blue-600 hover:text-blue-500">
                        {{ t("register.termsLink") }}
                      </a>
                    </p>
                  </div>
                </div>

                <div class="flex items-start">
                  <div class="flex items-center h-5">
                    <input
                      id="privacy"
                      type="checkbox"
                      v-model="form.acceptPrivacy"
                      required
                      class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div class="ml-3 text-sm">
                    <label for="privacy" class="font-medium text-gray-700">
                      {{ t("register.acceptPrivacy") }}
                    </label>
                    <p class="text-gray-500">
                      <a href="#" class="text-blue-600 hover:text-blue-500">
                        {{ t("register.privacyLink") }}
                      </a>
                    </p>
                  </div>
                </div>

                <div class="flex items-start">
                  <div class="flex items-center h-5">
                    <input
                      id="marketing"
                      type="checkbox"
                      v-model="form.acceptMarketing"
                      class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div class="ml-3 text-sm">
                    <label for="marketing" class="font-medium text-gray-700">
                      {{ t("register.acceptMarketing") }}
                    </label>
                  </div>
                </div>
              </div>

              <!-- Submit Button -->
              <div>
                <button
                  type="submit"
                  class="btn btn-primary w-full flex justify-center"
                  :disabled="loading || !isFormValid"
                >
                  <svg
                    v-if="loading"
                    class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {{ loading ? t("register.creating") : t("register.create") }}
                </button>
              </div>
            </form>

            <p class="mt-6 text-center text-sm text-gray-600">
              {{ t("register.haveAccount") }}
              <router-link
                to="/login"
                class="font-medium text-blue-600 hover:text-blue-500"
              >
                {{ t("register.login") }}
              </router-link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { EyeIcon, EyeSlashIcon } from "@heroicons/vue";
import { auth } from "../firebase/config";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useAnalytics } from "../composables/useAnalytics";
import { useDeviceInfo } from "../composables/useDeviceInfo";
import { useI18n } from "../composables/useI18n";
import { UserPlusIcon } from "@heroicons/vue/24/outline";

const router = useRouter();
const { logEvent } = useAnalytics();
const { collectDeviceInfo } = useDeviceInfo();
const { t } = useI18n();

const form = ref({
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
  acceptPrivacy: false,
  acceptMarketing: false,
});

const errors = ref({
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
});

const loading = ref(false);
const showPassword = ref(false);

// Password strength calculation
const passwordStrength = computed(() => {
  const password = form.value.password;
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const requirements = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial];
  const score = requirements.filter(Boolean).length;

  return {
    score,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
    label: ["Weak", "Fair", "Good", "Strong", "Very Strong"][score - 1] || "Too Weak",
  };
});

const passwordStrengthClass = computed(() => {
  const classes = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-green-600",
  ];
  return classes[passwordStrength.value.score - 1] || classes[0];
});

const passwordStrengthTextClass = computed(() => {
  const classes = [
    "text-red-600",
    "text-orange-600",
    "text-yellow-600",
    "text-green-600",
    "text-green-700",
  ];
  return classes[passwordStrength.value.score - 1] || classes[0];
});

const isFormValid = computed(() => {
  return (
    form.value.fullName.length >= 2 &&
    form.value.fullName.length <= 50 &&
    /^[A-Za-z ]+$/.test(form.value.fullName) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email) &&
    passwordStrength.value.score >= 3 &&
    form.value.password === form.value.confirmPassword &&
    form.value.acceptTerms &&
    form.value.acceptPrivacy
  );
});

// Real-time password matching validation
watch(
  () => form.value.confirmPassword,
  (newValue) => {
    if (newValue && newValue !== form.value.password) {
      errors.value.confirmPassword = t("register.errors.passwordMismatch");
    } else {
      errors.value.confirmPassword = "";
    }
  }
);

async function handleRegister() {
  if (!isFormValid.value) return;

  loading.value = true;
  errors.value = { fullName: "", email: "", password: "", confirmPassword: "" };

  try {
    const deviceInfo = await collectDeviceInfo();
    logEvent("registration_attempt", { deviceInfo });

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      form.value.email,
      form.value.password
    );

    await updateProfile(userCredential.user, {
      displayName: form.value.fullName,
    });

    logEvent("registration_success", {
      userId: userCredential.user.uid,
      deviceInfo,
    });

    router.push("/");
  } catch (error) {
    logEvent("registration_failure", {
      error: error.code,
      email: form.value.email,
    });

    if (error.code === "auth/email-already-in-use") {
      errors.value.email = t("register.errors.emailInUse");
    } else if (error.code === "auth/invalid-email") {
      errors.value.email = t("register.errors.invalidEmail");
    } else if (error.code === "auth/weak-password") {
      errors.value.password = t("register.errors.weakPassword");
    } else {
      errors.value.email = t("register.errors.generic");
    }
  } finally {
    loading.value = false;
  }
}
</script>
