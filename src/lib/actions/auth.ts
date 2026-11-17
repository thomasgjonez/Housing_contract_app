"use server";

import { redirect } from "next/navigation";
import { endSession, startSession } from "../auth";
import { isAdminEmail } from "../config";
import { linkFormProfile } from "../data/buyers";
import { createUser, findUserByEmail } from "../data/users";
import { safeNext, str, type FormState } from "../form";
import { checkPassword, hashPassword, isSchoolEmail } from "../passwords";

export async function signup(_: FormState, fd: FormData): Promise<FormState> {
  const name = str(fd, "name");
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  if (!name || !email || password.length < 8) {
    return { error: "Enter your name, an email, and a password of at least 8 characters." };
  }
  if (findUserByEmail(email)) return { error: "That email already has an account. Try logging in." };
  const id = createUser({
    name,
    email,
    password_hash: hashPassword(password),
    school_email_verified: isSchoolEmail(email) ? 1 : 0,
    is_admin: isAdminEmail(email) ? 1 : 0,
  });
  // Someone who filled out the Google Form gets their answers back.
  linkFormProfile({ id, email, phone: null });
  await startSession(id);
  redirect(safeNext(str(fd, "next")));
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const user = findUserByEmail(str(fd, "email"));
  if (!user || !checkPassword(str(fd, "password"), user.password_hash)) {
    return { error: "Email or password is wrong." };
  }
  linkFormProfile(user);
  await startSession(user.id);
  redirect(safeNext(str(fd, "next")));
}

export async function logout() {
  await endSession();
  redirect("/");
}
