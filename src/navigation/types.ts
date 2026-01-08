export type RootTabParamList = {
  Home: undefined;
  Watch: undefined;
  Community: undefined;
  Events: undefined;
};

export type RootTabName = keyof RootTabParamList;

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Tabs: undefined;
  Account: undefined;
  Admin: undefined;
};
