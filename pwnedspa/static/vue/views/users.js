import { useAppStore } from '../stores/app-store.js';
import { fetchWrapper } from '../helpers/fetch-wrapper.js';

const { ref } = Vue;

const template = `
<div class="flex-column users">
    <div v-if="users.length > 0" class="responsive-table users-table">
        <div class="responsive-table-headers">
            <div class="responsive-table-header" style="flex-basis: 20%;">{{ headings.name }}</div>
            <div class="responsive-table-header" style="flex-basis: 20%;">{{ headings.username }}</div>
            <div class="responsive-table-header" style="flex-basis: 30%;">{{ headings.email }}</div>
            <div class="responsive-table-header" style="flex-basis: 10%;">{{ headings.role }}</div>
            <div class="responsive-table-header" style="flex-basis: 10%;">{{ headings.status }}</div>
            <div class="responsive-table-header" style="flex-basis: 10%;"></div>
        </div>
        <div class="responsive-table-body">
            <div class="responsive-table-row users-table-row shaded-light rounded" v-for="user in users" :key="user.id">
                <div class="responsive-table-cell" style="flex-basis: 20%;">
                    <div class="mobile-header">{{ headings.name }}</div>
                    <div class="flex-row flex-align-center">
                        <div class="avatar">
                            <router-link :to="{ name: 'profile', params: { userId: user.id } }">
                                <img class="circular bordered-dark" :src="user.avatar" title="Avatar" />
                            </router-link>
                        </div>
                        <div>{{ user.name }}</div>
                    </div>
                </div>
                <div class="responsive-table-cell" style="flex-basis: 20%;">
                    <div class="mobile-header">{{ headings.username }}</div>
                    <div>{{ user.username }}</div>
                </div>
                <div class="responsive-table-cell" style="flex-basis: 30%;">
                    <div class="mobile-header">{{ headings.email }}</div>
                    <div>{{ user.email }}</div>
                </div>
                <div class="responsive-table-cell" style="flex-basis: 10%;">
                    <div class="mobile-header">{{ headings.role }}</div>
                    <div>{{ user.role }}</div>
                </div>
                <div class="responsive-table-cell" style="flex-basis: 10%;">
                    <div class="mobile-header">{{ headings.status }}</div>
                    <div>{{ user.status }}</div>
                </div>
                <div class="responsive-table-cell" style="flex-basis: 10%;">
                    <div class="mobile-header">Actions</div>
                    <div class="actions-cell">
                        <a v-if="user.role == 'admin'" class="img-btn" @click.stop="updateUser(user, 'demote')">
                            <i class="fas fa-user-minus" title="Demote"></i>
                        </a>
                        <a v-if="user.role == 'user'" class="img-btn" @click.stop="updateUser(user, 'promote')">
                            <i class="fas fa-user-plus" title="Promote"></i>
                        </a>
                        <a v-if="user.status == 'enabled'" class="img-btn" @click.stop="updateUser(user, 'disable')">
                            <i class="fas fa-user-slash" title="Disable"></i>
                        </a>
                        <a v-if="user.status == 'disabled'" class="img-btn" @click.stop="updateUser(user, 'enable')">
                            <i class="fas fa-user" title="Enable"></i>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`;

export default {
    name: 'Users',
    template,
    setup () {
        const appStore = useAppStore();

        const users = ref([]);
        const headings = ref({
            name: 'Display',
            username: 'Username',
            email: 'Email',
            role: 'Role',
            status: 'Status',
        });

        function getUsers() {
            fetchWrapper.get(`${API_BASE_URL}/users`)
            .then(json => {
                users.value = json.users;
            })
            .catch(error => appStore.createToast(error));
        };

        function updateUser(user, action) {
            var userForm = {};
            switch (action) {
                case 'demote':
                    userForm.role = 1;
                    break;
                case 'promote':
                    userForm.role = 0;
                    break;
                case 'disable':
                    userForm.status = 0;
                    break;
                case 'enable':
                    userForm.status = 1;
                    break;
            };
            fetchWrapper.patch(`${API_BASE_URL}/admin/users/${user.id}`, userForm)
            .then(json => {
                users.value.splice(users.value.findIndex(u => u.id === user.id), 1, json)
            })
            .catch(error => appStore.createToast(error));
        };

        getUsers();

        return {
            users,
            headings,
            updateUser,
        };
    },
};
