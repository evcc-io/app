import SwiftUI

@main
struct EvccWatchApp: App {
  @StateObject private var servers = ServerList()

  var body: some Scene {
    WindowGroup {
      ContentView()
        .environmentObject(servers)
    }
  }
}

struct ContentView: View {
  @EnvironmentObject private var servers: ServerList
  @StateObject private var model = SiteModel()
  @Environment(\.scenePhase) private var scenePhase
  @State private var showServers = false

  private var pollKey: String {
    "\(servers.selected?.id ?? "")|\(servers.selected?.url ?? "")|\(scenePhase == .active)"
  }

  var body: some View {
    NavigationStack {
      if let server = servers.selected {
        pages(server)
          .navigationTitle(server.displayTitle)
          .toolbar {
            if servers.servers.count > 1 {
              ToolbarItem(placement: .topBarLeading) {
                Button {
                  showServers = true
                } label: {
                  Image(systemName: "server.rack")
                }
                .accessibilityLabel(L.t("widget.config.server"))
              }
            }
          }
          .sheet(isPresented: $showServers) {
            ServerPicker(selectedId: $servers.selectedId, servers: servers.servers)
          }
      } else {
        EmptyStateView()
      }
    }
    .task(id: pollKey) {
      guard scenePhase == .active, let server = servers.selected else { return }
      await model.poll(server)
    }
  }

  private func pages(_ server: StoredServer) -> some View {
    TabView {
      OverviewPage(model: model)
      ForEach(Array((model.state?.loadpoints ?? []).enumerated()), id: \.offset) { index, lp in
        LoadpointPage(model: model, server: server, index: index, loadpoint: lp)
      }
    }
    .tabViewStyle(.verticalPage)
    .alert(L.t("watch.modeFailed"), isPresented: $model.modeFailed) {
      Button("OK", role: .cancel) {}
    }
  }
}

struct ServerPicker: View {
  @Binding var selectedId: String?
  let servers: [StoredServer]
  @Environment(\.dismiss) private var dismiss

  var body: some View {
    List(servers) { server in
      Button {
        selectedId = server.id
        dismiss()
      } label: {
        HStack {
          Text(server.displayTitle).lineLimit(2)
          Spacer()
          if server.id == selectedId {
            Image(systemName: "checkmark").foregroundStyle(Color.evccDarkGreen)
          }
        }
      }
    }
    .navigationTitle(L.t("widget.config.server"))
  }
}

struct EmptyStateView: View {
  var body: some View {
    VStack(spacing: 8) {
      Image(systemName: "iphone")
        .font(.title2)
        .foregroundStyle(Color.evccDarkGreen)
      Text(L.t("watch.empty.title")).font(.headline)
      Text(L.t("watch.empty.body"))
        .font(.footnote)
        .foregroundStyle(.secondary)
        .multilineTextAlignment(.center)
    }
    .padding()
  }
}
