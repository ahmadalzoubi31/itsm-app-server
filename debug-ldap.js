const { Client } = require('ldapts');

// This is a simple script to test LDAP connection
// You can modify these values to test your LDAP server

const ldapConfig = {
  server: '192.168.1.106',  // Replace with your LDAP server
  port: '389',                     // Replace with your LDAP port
  protocol: 'ldap',                // 'ldap' or 'ldaps'
  bindDn: 'administrator@test.local',  // Replace with your bind DN
  bindPassword: 'P@ssw0rd',   // Replace with your bind password
  searchBase: 'dc=test,dc=local', // Replace with your search base
  searchFilter: '(objectClass=user)',
  attributes: 'cn,mail,sAMAccountName,displayName,department,givenName,sn,title,mobile,userPrincipalName'
};

async function testLdapConnection() {
  console.log('🔍 Testing LDAP Connection...\n');
  
  const url = ldapConfig.protocol === 'ldaps' 
    ? `ldaps://${ldapConfig.server}:${ldapConfig.port}`
    : `ldap://${ldapConfig.server}:${ldapConfig.port}`;

  console.log('Connection Details:');
  console.log('==================');
  console.log(`URL: ${url}`);
  console.log(`Bind DN: ${ldapConfig.bindDn}`);
  console.log(`Search Base: ${ldapConfig.searchBase}`);
  console.log(`Search Filter: ${ldapConfig.searchFilter}`);
  console.log(`Attributes: ${ldapConfig.attributes}\n`);

  try {
    const client = new Client({ url });
    
    console.log('🔐 Attempting LDAP bind...');
    await client.bind(ldapConfig.bindDn, ldapConfig.bindPassword);
    console.log('✅ LDAP bind successful!\n');
    
    console.log('🔍 Searching for users...');
    const result = await client.search(ldapConfig.searchBase, {
      scope: 'sub',
      filter: ldapConfig.searchFilter,
      attributes: ldapConfig.attributes.split(',').map(a => a.trim()),
      paged: { pageSize: 500 }
    });
    
    console.log(`✅ Search successful! Found ${result.searchEntries.length} users\n`);
    
    // Show first 3 users as preview
    if (result.searchEntries.length > 0) {
      console.log('📋 First 3 users found:');
      console.log('=======================');
      result.searchEntries.slice(0, 3).forEach((user, index) => {
        console.log(`\nUser ${index + 1}:`);
        Object.keys(user).forEach(key => {
          if (key !== 'dn') {
            console.log(`  ${key}: ${user[key]}`);
          }
        });
      });
    }
    
    await client.unbind();
    console.log('\n✅ LDAP test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ LDAP Error:', {
      message: error.message,
      code: error.code,
      name: error.name
    });
    
    console.log('\n💡 Troubleshooting Tips:');
    console.log('========================');
    console.log('1. Check if the LDAP server is running and accessible');
    console.log('2. Verify the server address and port');
    console.log('3. Ensure the bind DN and password are correct');
    console.log('4. Check if the search base exists');
    console.log('5. Verify network connectivity to the LDAP server');
    console.log('6. If using LDAPS, ensure SSL certificates are valid');
  }
}

// Run the test
testLdapConnection().catch(console.error); 