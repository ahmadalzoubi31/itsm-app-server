import { Injectable } from '@nestjs/common';
import { Client } from 'ldapts';

@Injectable()
export class LdapService {
  async searchUsers() {
    // 1. Setup
    const url = 'ldap://ldap.forumsys.com'; // or ldaps://...
    const bindDN = 'cn=read-only-admin,dc=example,dc=com'; //administrator@domain.local or 'CN=Administrator,CN=Users,DC=domain,DC=local'
    const password = 'password';
    const baseDN = 'dc=example,dc=com';

    // 2. Create client and bind
    const client = new Client({ url });
    await client.bind(bindDN, password);

    // 3. Search
    const { searchEntries } = await client.search(baseDN, {
      scope: 'sub',
      filter: '&(objectClass=person)(mail=*)', // Change filter as needed
      attributes: [
        'cn', // Common Name
        'mail', // Email address
        'sAMAccountName', // Username (pre-Windows 2000)
        'userPrincipalName', // Login name (UPN)
        'sn', // Surname (Last Name)
        'givenName', // First Name
        'displayName', // Full Name (First + Last)
        'memberOf', // Groups this user belongs to
        'telephoneNumber', // Office phone
        'mobile', // Mobile phone
        'title', // Job Title
        'department', // Department
        'company', // Company/Organization
        'manager', // DN of the user's manager
        'whenCreated', // Account creation date
        'whenChanged', // Last modified date
        'objectGUID', // Unique user GUID
        'objectSid', // Unique user SID
      ],
    });

    // 4. Unbind and return users
    await client.unbind();
    return searchEntries;
  }
}
