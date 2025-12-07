import axios from 'axios';
import core from "../../../../../utils/core.js";
import { supabase } from '../../../../../utils/database/supabase.js';
import { AuthError } from './authTypes';
import { APIUser, RESTGetAPICurrentUserGuildsResult } from "discord.js";

const BOT_ADMIN_UIDs = process.env["BOT_ADMIN_USER_IDS"]?.split(",") ?? [];

/** Fetch FRESH Discord Data for a user by `accessToken`. */
export async function fetchUserDiscordData(accessToken: string) {
    // 4. Get Discord - USER Data:
    const userResponse = await axios.get("https://discord.com/api/users/@me", { headers: { Authorization: `Bearer ${accessToken}` } });
    const userData: APIUser = userResponse?.data;
    if (!userData) return new AuthError('fetchUser', { source: 'Discord user data fetch from token.' });
    const userDataMapped = {
        id: userData?.id,
        username: userData?.username,
        email: userData?.email,
        display_name: userData?.global_name,
        avatar: userData?.avatar
            ? `https://cdn.discordapp.com/avatars/${userData?.id}/${userData.avatar}.${userData.avatar.startsWith("a_") ? "gif" : "png"}`
            : `https://cdn.discordapp.com/embed/avatars/0.png`,
    };
    if (!userDataMapped.email) return new AuthError('missingEmail');

    // 5. Get DISCORD - User's Guilds - Map:
    const botGuilds = await core.botClient.guilds.fetch();
    const botGuildsIds = botGuilds.map((g) => g.id);
    const ADMINISTRATOR = 0x00000008;
    const MANAGE_GUILD = 0x00000020;
    const guildsResponse = await axios.get("https://discord.com/api/users/@me/guilds", { headers: { Authorization: `Bearer ${accessToken}` } });
    const guilds: RESTGetAPICurrentUserGuildsResult = guildsResponse.data;
    if (!guilds) return new AuthError('fetchUser', { source: 'Discord user guilds data fetch from token.' });
    const userGuildsMapped = guilds.map((g) => ({
        id: g?.id,
        name: g?.name,
        icon: g?.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.${g.icon.startsWith("a_") ? "gif" : "png"}` : `https://cdn.discordapp.com/embed/avatars/0.png`,
        permissions: g?.permissions,
        isOwner: g?.owner,
        memberCount: g?.approximate_member_count,
        hasSessionsBot: botGuildsIds.includes(g?.id),
    }));
    const manageableGuildsMapped = userGuildsMapped.filter((guild) => {
        const permissions = BigInt(guild?.["permissions_new"] ?? guild.permissions);
        return (permissions & BigInt(ADMINISTRATOR)) !== 0n || (permissions & BigInt(MANAGE_GUILD)) !== 0n;
    });

    return { user: userDataMapped, guilds: { all: userGuildsMapped, manageable: manageableGuildsMapped } };
}

/** Updates/Creates an auth user and their data within users and profiles inside DB. */
export async function updateAuthUser(userData: any, guildsData: any, accessToken: string, refreshToken: string, tokenExp: number) {
    try {
        // Get User's "APP ROLES":
        const appRoles = () => {
            const isBotAdmin = BOT_ADMIN_UIDs.includes(userData?.id);
            if (isBotAdmin) return ['user', 'admin'];
            else return ['user'];
        };

        // Search for Existing User:
        const { data: foundProfile, error: fetchErr } = await supabase.from('profiles').select('*').eq("discord_id", userData?.id).maybeSingle();
        if (fetchErr) throw new AuthError('fetchUser', { fetchErr });
        if (foundProfile) { // Existing User Found - UPDATE:
            // Update User Data - PROFILE:
            const userUid = foundProfile?.id;
            const { data: updProfile, error: updateProfileErr } = await supabase.from('profiles')
                .update({
                    discord_id: userData.id,
                    email: userData.email,
                    username: userData.username,
                    discord_access_token: accessToken,
                    discord_refresh_token: refreshToken,
                    discord_token_expires_at: new Date(Date.now() + tokenExp * 1000).toISOString(),
                })
                .eq('id', userUid)
                .select().single()
            if (!updProfile || updateProfileErr) throw new AuthError('updateUser', { updProfile, updateProfileErr, userData });

            // Update User Data - USER:
            const { data: { user: updUser }, error: updateUserErr } = await supabase.auth.admin.updateUserById(userUid, {
                email: userData.email,
                app_metadata: {
                    roles: appRoles(),
                    last_synced: new Date().toISOString(),
                },
                user_metadata: {
                    ...userData,
                    guilds: guildsData
                },
            });
            if (!updUser || updateUserErr) throw new AuthError('updateUser', { updUser, updateUserErr, userData });

            // Return User/Profile:
            return { user: updUser, profile: updProfile }

        } else { // NO Existing User Found - CREATE:
            // Create new - auth USER:
            const { data: { user: newUser }, error: createUserErr } = await supabase.auth.admin.createUser({
                email: userData.email,
                email_confirm: true,
                app_metadata: {
                    roles: appRoles(),
                    last_synced: new Date().toISOString()
                },
                user_metadata: {
                    ...userData,
                    guilds: guildsData,
                },
            });
            if (!newUser || createUserErr) throw new AuthError('createUser', { newUser, createUserErr, userData });

            // Create new - auth PROFILE:
            const { data: newProfile, error: createProfileErr } = await supabase
                .from("profiles")
                .upsert({
                    id: newUser.id,
                    discord_id: userData.id,
                    email: userData.email,
                    username: userData.username,
                    discord_access_token: accessToken,
                    discord_refresh_token: refreshToken,
                    discord_token_expires_at: new Date(Date.now() + tokenExp * 1000).toISOString(),
                    created_at: new Date().toISOString(),
                })
                .select();
            if (!newProfile || createProfileErr) throw new AuthError('createUser', { newProfile, createProfileErr, userData });

            // Return User/Profile:
            return { user: newUser, profile: newProfile }
        }
    } catch (err) {
        // Error Occurred:
        if (err instanceof AuthError) return err;
        else return new AuthError('unknown', { err })
    }
}