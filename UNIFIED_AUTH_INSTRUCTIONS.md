# Sistema de Autenticação Unificado

## 🚀 Nova Arquitetura de Autenticação

O sistema agora utiliza uma **única tabela `users`** com campo `role` para unificar a autenticação de clientes e administradores.

### ✅ Melhorias Implementadas:
- **Uma única tabela**: `public.users` com campo `role ('customer'|'admin')`
- **Autenticação única**: Admin usa o mesmo sistema de login dos clientes
- **Store unificado**: `authStore` inclui funções administrativas
- **Migrations limpas**: Removida complexidade da tabela `admin_users`

## 🔧 Como Executar a Migration

### 1. Execute a Migration Unificada
```sql
-- Execute no Supabase Dashboard → SQL Editor:
-- File: supabase/migrations/20250812200000_unify_user_roles.sql
```

### 2. Verificação Pós-Migration
A migration automaticamente:
- ✅ Adiciona campos `role`, `permissions`, `last_login_at` na tabela `users`
- ✅ Migra dados da `admin_users` para `users` (se existir)
- ✅ Define usuário específico como admin
- ✅ Remove tabela `admin_users` e funções relacionadas
- ✅ Atualiza RLS policies

## 🔐 Acesso ao Admin

### URL de Login
```
http://localhost:5173/admin/login
```

### Credenciais
- **Email**: O email do usuário que foi definido como admin na migration
- **Senha**: A mesma senha que o usuário usa para login regular
- **Verificação**: Após login, o sistema verifica se `user.role === 'admin'`

### Fluxo de Autenticação Admin
1. **Usuario faz login** na página `/admin/login`
2. **Sistema autentica** usando o `authStore` regular
3. **Verifica role** se `user.role === 'admin'`
4. **Se não for admin**: Faz logout automático e mostra erro
5. **Se for admin**: Redireciona para `/admin/dashboard`

## 📋 Estrutura Técnica

### Frontend (React)
- **Login Admin**: `/admin/login` → Usa `authStore` regular
- **Store Admin**: `adminAuthStore` → Wrapper do `authStore`
- **Guard**: `AdminRoute` → Verifica `role === 'admin'`
- **Permissões**: Via campo `permissions` (JSONB) na tabela `users`

### Backend (Supabase)
- **Tabela única**: `public.users` com campo `role`
- **Funções auxiliares**: `is_admin()`, `get_user_permissions()`, `update_last_login()`
- **RLS**: Políticas atualizadas para suportar roles

### State Management (Zustand)
- **authStore**: Store principal com funções admin integradas
- **adminAuthStore**: Wrapper simplificado que usa `authStore`
- **Persistência**: Dados salvos automaticamente

## 🎯 Vantagens da Nova Arquitetura

### ✅ Simplicidade
- **Uma tabela**: Menos complexidade no banco
- **Um store**: Estado unificado para toda autenticação
- **Uma API**: Mesmas funções para login/logout

### ✅ Manutenibilidade
- **Código limpo**: Sem duplicação de lógica de auth
- **Tipos únicos**: Interface `User` serve para tudo
- **Migrations simples**: Menos tabelas para gerenciar

### ✅ Escalabilidade
- **Roles flexíveis**: Fácil adicionar novos roles
- **Permissões granulares**: Campo JSONB permite controle fino
- **Extensível**: Fácil adicionar campos específicos

## 🔍 Verificação do Sistema

### Teste o Login Admin
1. Execute a migration
2. Acesse `http://localhost:5173/admin/login`
3. Use email/senha do usuário definido como admin
4. Verifique redirecionamento para dashboard

### Debug - Verificar Usuário Admin
```sql
SELECT id, email, full_name, role, permissions 
FROM public.users 
WHERE role = 'admin';
```

### Debug - Testar Funções
```sql
SELECT is_admin('USER_ID_HERE') as is_user_admin;
SELECT get_user_permissions('USER_ID_HERE') as user_permissions;
```

## 🛠️ Resolução de Problemas

### "Access denied. Admin privileges required"
- ✅ Verifique se o usuário tem `role = 'admin'` na tabela `users`
- ✅ Execute a migration se ainda não executou

### "Login failed"
- ✅ Use as credenciais normais do usuário (mesmas do login da loja)
- ✅ Verifique se o usuário existe na tabela `users`

### Permissões negadas
- ✅ Verifique o campo `permissions` do usuário admin
- ✅ Migration define permissões completas automaticamente

## 📝 Próximos Passos

1. **Execute a migration**: `20250812200000_unify_user_roles.sql`
2. **Teste o login admin**: Use email/senha do usuário definido
3. **Verifique permissões**: Acesse diferentes áreas do admin
4. **Ajuste se necessário**: Modifique permissões via UPDATE na tabela

---

✅ **Sistema unificado pronto para uso!**