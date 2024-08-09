import React, { useState } from "react";
import { Layout } from "@ui-kitten/components";
import { View } from "react-native";
import ServerForm from "../components/ServerForm";
import Header from "../components/Header";

import {  useAppContext } from "../components/AppContext";
import { BasicAuthInformation } from "../interfaces/basic-auth-information";

function navigateToServer(navigation) {
  navigation.navigate("Server");
}

function ServerManualScreen({ route, navigation }) {
  let paramsUrl = "";
  let paramsBasicAuthInformation = {basicAuthRequired: false} as BasicAuthInformation;
  if(route.params)
  {
    if(route.params.url)
    {
      paramsUrl = route.params.url;
    }
    if(route.params.basicAuthInformation)
    {
      paramsBasicAuthInformation = route.params.basicAuthInformation;
    }
  }
  const { updateServerUrl } = useAppContext();

  const memoizedUpdateServerUrl = React.useCallback(updateServerUrl, []);

  const memoizedHeader = React.useMemo(
    () => (
      <Header
        title="URL eingeben"
        showDone
        onDone={() => navigateToServer(navigation)}
      />
    ),
    [navigation],
  );
 
  return (
    <Layout style={{ flex: 1 }}>
      {memoizedHeader}
      <View style={{ paddingHorizontal: 16 }}>
        <ServerForm url={paramsUrl} basicAuth={paramsBasicAuthInformation} onChange={memoizedUpdateServerUrl} />
      </View>
    </Layout>
  );
}

export default React.memo(ServerManualScreen);
